from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework.test import APIClient

from clientes.models import Cliente, Empresa
from instrumentos.models import (
    CriterioAceitacao,
    CalibracaoStatus,
    Instrumento,
    InstrumentoDoCliente,
    MovimentacaoSetorInstrumento,
    Normativo,
    PontoDeCalibracao,
    ResultadoCalibracao,
    Setor,
    TipoInstrumento,
)
from instrumentos.serializers import (
    InstrumentoDoClienteWriteAdminSerializer,
    InstrumentoDoClienteWriteSerializer,
    SetorSerializer,
)
from clientes.signals import NORMAS_PADRAO, criar_normas_padrao


def _make_cliente():
    empresa = Empresa.objects.create(
        razao_social="Empresa Instrumentos",
        cnpj="11111111111111",
    )
    return Cliente.objects.create(empresa=empresa)


def _make_instrumento_base():
    tipo = TipoInstrumento.objects.create(descricao="Termometro")
    return Instrumento.objects.create(tipo_de_instrumento=tipo)


class InstrumentoDoClienteSetorPatchTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-SEM-SETOR",
            setor=None,
        )
        self.setor = Setor.objects.create(nome="Laboratorio", cliente=self.cliente)

    def test_patch_adiciona_setor_quando_instrumento_estava_sem_setor(self):
        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": self.setor.id},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, self.setor.id)

        movimentacao = MovimentacaoSetorInstrumento.objects.get(
            instrumento=self.instrumento
        )
        self.assertEqual(movimentacao.antigo_setor, "")
        self.assertEqual(movimentacao.novo_setor, self.setor.nome)

    def test_patch_mesmo_setor_nao_cria_movimentacao_duplicada(self):
        self.instrumento.setor = self.setor
        self.instrumento.save(update_fields=["setor"])

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": self.setor.id},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertFalse(
            MovimentacaoSetorInstrumento.objects.filter(
                instrumento=self.instrumento
            ).exists()
        )


class InstrumentoDoClienteSetorDuplicadoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(
            username="admin-setor",
            password="pass",
            is_staff=True,
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-SETOR-DUP",
            setor=None,
        )

    def test_admin_patch_usa_setor_existente_quando_ha_apenas_um_correspondente(self):
        setor = Setor.objects.create(nome="Laboratorio", cliente=self.cliente)

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": "Laboratorio"},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, setor.id)
        self.assertEqual(
            Setor.objects.filter(nome="Laboratorio", cliente=self.cliente).count(),
            1,
        )

    def test_admin_patch_com_setor_duplicado_usa_primeiro_id_e_nao_cria_terceiro(self):
        setor_mais_antigo = Setor.objects.create(nome="Laboratorio", cliente=self.cliente)
        Setor.objects.create(nome="Laboratorio", cliente=self.cliente)

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": "Laboratorio"},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, setor_mais_antigo.id)
        self.assertEqual(
            Setor.objects.filter(nome="Laboratorio", cliente=self.cliente).count(),
            2,
        )

    def test_admin_patch_cria_setor_novo_quando_nao_existe(self):
        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": "Producao/Linha 1"},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        setor_raiz = Setor.objects.get(nome="Producao", cliente=self.cliente)
        setor_filho = Setor.objects.get(
            nome="Linha 1",
            cliente=self.cliente,
            setor_pai=setor_raiz,
        )
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, setor_filho.id)

    def test_setor_serializer_nao_permite_criar_duplicado_no_mesmo_pai(self):
        setor_pai = Setor.objects.create(nome="Predio A", cliente=self.cliente)
        Setor.objects.create(
            nome="Laboratorio",
            cliente=self.cliente,
            setor_pai=setor_pai,
        )

        serializer = SetorSerializer(data={
            "nome": "Laboratorio",
            "cliente": self.cliente.id,
            "setor_pai_id": setor_pai.id,
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn("nome", serializer.errors)

    def test_setor_serializer_permite_mesmo_nome_em_pais_diferentes(self):
        setor_pai = Setor.objects.create(nome="Predio A", cliente=self.cliente)
        outro_pai = Setor.objects.create(nome="Predio B", cliente=self.cliente)
        Setor.objects.create(
            nome="Laboratorio",
            cliente=self.cliente,
            setor_pai=setor_pai,
        )

        serializer = SetorSerializer(data={
            "nome": "Laboratorio",
            "cliente": self.cliente.id,
            "setor_pai_id": outro_pai.id,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)


class CalibracaoResultadoHistoricoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente-cal", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-CAL-001",
        )
        self.criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

    def _post_calibracao(self, maior_erro="0.003", incerteza="0.002"):
        return self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "os 222222223",
                "observacoes": "",
                "maior_erro": maior_erro,
                "incerteza": incerteza,
                "criterio": self.criterio.id,
                "checagem": False,
            },
            format="json",
        )

    def test_cria_resultado_calibracao_com_decimais_pequenos(self):
        response = self._post_calibracao()

        self.assertEqual(response.status_code, 201, response.data)
        resultado = ResultadoCalibracao.objects.get(
            calibracao_id=response.data["id"]
        )
        self.assertEqual(resultado.criterio_id, self.criterio.id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))
        self.assertEqual(resultado.status, CalibracaoStatus.APROVADO)

    def test_resultado_historico_sobrevive_ao_patch_de_criterios_vazio(self):
        response = self._post_calibracao()
        self.assertEqual(response.status_code, 201, response.data)
        resultado_id = ResultadoCalibracao.objects.get(
            calibracao_id=response.data["id"]
        ).id

        patch_response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"criterios_aceitacao": []},
            format="json",
        )

        self.assertEqual(patch_response.status_code, 204, patch_response.data)
        resultado = ResultadoCalibracao.objects.get(id=resultado_id)
        self.assertEqual(resultado.criterio_id, self.criterio.id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))

    def test_resultado_historico_fica_sem_criterio_quando_criterio_e_deletado_explicitamente(self):
        response = self._post_calibracao()
        self.assertEqual(response.status_code, 201, response.data)
        resultado_id = ResultadoCalibracao.objects.get(
            calibracao_id=response.data["id"]
        ).id

        self.criterio.delete()

        resultado = ResultadoCalibracao.objects.get(id=resultado_id)
        self.assertIsNone(resultado.criterio_id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))

    def test_calibracao_rejeita_decimal_invalido(self):
        response = self._post_calibracao(maior_erro="abc")

        self.assertEqual(response.status_code, 400)
        self.assertIn("maior_erro", response.data)


class InstrumentoRelacionamentosIncrementaisTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente-rel", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REL-001",
        )

    def test_create_instrumento_cria_pontos_e_criterios(self):
        response = self.api.post(
            "/instrumentos/",
            {
                "cliente": self.cliente.id,
                "instrumento": self.instrumento_base.id,
                "tag": "TAG-REL-002",
                "posicao": "U",
                "pontos_de_calibracao": ["P1", "P2"],
                "criterios_aceitacao": [
                    {
                        "tipo": "Calibracao",
                        "criterio_de_aceitacao": "0.025",
                        "unidade": "mm",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        instrumento = InstrumentoDoCliente.objects.get(tag="TAG-REL-002")
        self.assertEqual(instrumento.pontos_de_calibracao.count(), 2)
        self.assertEqual(instrumento.criterios_aceitacao.count(), 1)

    def test_update_adiciona_pontos_sem_apagar_antigos_e_sem_duplicar(self):
        self.instrumento.pontos_de_calibracao.create(nome="P1")

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"pontos_de_calibracao": ["P1", "P2", "P2"]},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertCountEqual(
            list(self.instrumento.pontos_de_calibracao.values_list("nome", flat=True)),
            ["P1", "P2"],
        )

    def test_read_instrumento_retorna_id_dos_pontos_de_calibracao(self):
        ponto = self.instrumento.pontos_de_calibracao.create(nome="P1")

        response = self.api.get(f"/instrumentos/{self.instrumento.id}/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["pontos_de_calibracao"][0]["id"], ponto.id)
        self.assertEqual(response.data["pontos_de_calibracao"][0]["nome"], "P1")

    def test_update_reenvia_ponto_com_id_sem_duplicar(self):
        ponto = self.instrumento.pontos_de_calibracao.create(nome="P1")

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"pontos_de_calibracao": [{"id": ponto.id, "nome": "P1"}]},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertEqual(self.instrumento.pontos_de_calibracao.count(), 1)

    def test_update_adiciona_criterio_sem_apagar_antigo(self):
        criterio_antigo = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {
                "criterios_aceitacao": [
                    {
                        "tipo": "Checagem",
                        "criterio_de_aceitacao": "0.010",
                        "unidade": "mm",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertTrue(
            CriterioAceitacao.objects.filter(id=criterio_antigo.id).exists()
        )
        self.assertEqual(self.instrumento.criterios_aceitacao.count(), 2)

    def test_update_reenvia_criterio_existente_sem_duplicar(self):
        criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {
                "criterios_aceitacao": [
                    {
                        "tipo": criterio.tipo,
                        "criterio_de_aceitacao": "0.025",
                        "unidade": criterio.unidade,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertEqual(self.instrumento.criterios_aceitacao.count(), 1)

    def test_update_criterio_com_id_atualiza_sem_recriar(self):
        criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {
                "criterios_aceitacao": [
                    {
                        "id": criterio.id,
                        "tipo": "Calibracao",
                        "criterio_de_aceitacao": "0.030",
                        "unidade": "mm",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        criterio.refresh_from_db()
        self.assertEqual(criterio.criterio_de_aceitacao, Decimal("0.030"))
        self.assertEqual(self.instrumento.criterios_aceitacao.count(), 1)

    def test_serializers_normal_e_admin_usam_funcao_compartilhada(self):
        class Request:
            user = self.user

        with patch("instrumentos.serializers.atualizar_relacionamentos_instrumento") as service_mock:
            InstrumentoDoClienteWriteSerializer(context={"request": Request()}).update(
                self.instrumento,
                {},
            )
            InstrumentoDoClienteWriteAdminSerializer(context={"request": Request()}).update(
                self.instrumento,
                {},
            )

        self.assertEqual(service_mock.call_count, 2)


class InstrumentoRemocaoRelacionamentosEndpointTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente-rem", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REM-001",
        )

    def test_remove_normativo_apenas_da_associacao_do_instrumento(self):
        outro_instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REM-002",
        )
        normativo = Normativo.objects.create(nome="ISO 17025", cliente=self.cliente)
        self.instrumento.normativos.add(normativo)
        outro_instrumento.normativos.add(normativo)

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/normativos/{normativo.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertTrue(Normativo.objects.filter(id=normativo.id).exists())
        self.assertFalse(self.instrumento.normativos.filter(id=normativo.id).exists())
        self.assertTrue(outro_instrumento.normativos.filter(id=normativo.id).exists())

    def test_remove_ponto_de_calibracao_do_instrumento(self):
        ponto = PontoDeCalibracao.objects.create(
            instrumento=self.instrumento,
            nome="P1",
        )

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/pontos-calibracao/{ponto.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(PontoDeCalibracao.objects.filter(id=ponto.id).exists())

    def test_nao_remove_ponto_de_outro_instrumento(self):
        outro_instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REM-003",
        )
        ponto = PontoDeCalibracao.objects.create(
            instrumento=outro_instrumento,
            nome="P1",
        )

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/pontos-calibracao/{ponto.id}/"
        )

        self.assertEqual(response.status_code, 404)
        self.assertTrue(PontoDeCalibracao.objects.filter(id=ponto.id).exists())

    def test_remove_criterio_sem_apagar_resultado_historico(self):
        criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )
        calibracao_response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-REM-001",
                "maior_erro": "0.003",
                "incerteza": "0.002",
                "criterio": criterio.id,
                "checagem": False,
            },
            format="json",
        )
        self.assertEqual(calibracao_response.status_code, 201, calibracao_response.data)
        resultado = ResultadoCalibracao.objects.get(
            calibracao_id=calibracao_response.data["id"]
        )

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/criterios-aceitacao/{criterio.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(CriterioAceitacao.objects.filter(id=criterio.id).exists())
        resultado.refresh_from_db()
        self.assertIsNone(resultado.criterio_id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))


class NormativoDuplicidadeTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="usuario-normas", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-NORMAS",
        )

    def test_normas_padrao_nao_duplicam_quando_signal_roda_mais_de_uma_vez(self):
        criar_normas_padrao(sender=Cliente, instance=self.cliente, created=True)
        criar_normas_padrao(sender=Cliente, instance=self.cliente, created=True)

        for nome in NORMAS_PADRAO:
            self.assertEqual(
                Normativo.objects.filter(cliente=self.cliente, nome__iexact=nome).count(),
                1,
            )

    def test_cliente_com_multiplos_usuarios_nao_recebe_normas_padrao_duplicadas(self):
        outro_usuario = User.objects.create_user(username="outro-usuario", password="pass")
        outro_usuario.clientes.add(self.cliente)
        criar_normas_padrao(sender=Cliente, instance=self.cliente, created=False)

        for nome in NORMAS_PADRAO:
            self.assertEqual(
                Normativo.objects.filter(cliente=self.cliente, nome__iexact=nome).count(),
                1,
            )

    def test_post_normativo_manual_com_mesmo_nome_reutiliza_existente(self):
        existente = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        existente.nome = "ISO  9001"
        existente.save(update_fields=["nome"])

        response = self.api.post(
            "/normativos/",
            {"cliente": self.cliente.id, "nome": "  iso 9001  "},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["id"], existente.id)
        self.assertEqual(
            [
                normativo for normativo in Normativo.objects.filter(cliente=self.cliente)
                if " ".join(normativo.nome.split()).casefold() == "iso 9001"
            ],
            [existente],
        )

    def test_listagem_deduplica_normativos_com_espacos_extras(self):
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        Normativo.objects.create(cliente=self.cliente, nome="ISO  9001")

        response = self.api.get("/normativos/", {"cliente": self.cliente.id})

        self.assertEqual(response.status_code, 200, response.data)
        iso_9001 = [
            normativo for normativo in response.data
            if " ".join(normativo["nome"].split()).casefold() == "iso 9001"
        ]
        self.assertEqual(len(iso_9001), 1)
        self.assertEqual(iso_9001[0]["id"], canonico.id)

    def test_listagem_admin_retorna_normativos_unicos_por_cliente(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        Normativo.objects.create(cliente=self.cliente, nome="iso 9001")

        response = self.api.get("/normativos/", {"cliente": self.cliente.id})

        self.assertEqual(response.status_code, 200, response.data)
        iso_9001 = [
            normativo for normativo in response.data
            if normativo["nome"].casefold() == "iso 9001"
        ]
        self.assertEqual(len(iso_9001), 1)
        self.assertEqual(iso_9001[0]["id"], canonico.id)

    def test_listagem_usuario_comum_retorna_normativos_unicos(self):
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        Normativo.objects.create(cliente=self.cliente, nome="ISO 9001")

        response = self.api.get("/normativos/", {"cliente": self.cliente.id})

        self.assertEqual(response.status_code, 200, response.data)
        iso_9001 = [
            normativo for normativo in response.data
            if normativo["nome"].casefold() == "iso 9001"
        ]
        self.assertEqual(len(iso_9001), 1)
        self.assertEqual(iso_9001[0]["id"], canonico.id)

    def test_edicao_instrumento_associa_normativo_canonico_com_duplicados_historicos(self):
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        duplicado = Normativo.objects.create(cliente=self.cliente, nome="iso 9001")

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"normativos": [{"id": duplicado.id, "nome": duplicado.nome}]},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertTrue(self.instrumento.normativos.filter(id=canonico.id).exists())
        self.assertFalse(self.instrumento.normativos.filter(id=duplicado.id).exists())
        self.assertTrue(Normativo.objects.filter(id=duplicado.id).exists())
