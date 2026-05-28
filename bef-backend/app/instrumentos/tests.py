from decimal import Decimal

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
    ResultadoCalibracao,
    Setor,
    TipoInstrumento,
)


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

    def test_resultado_historico_sobrevive_quando_criterio_e_removido_do_instrumento(self):
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
        self.assertIsNone(resultado.criterio_id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))

    def test_calibracao_rejeita_decimal_invalido(self):
        response = self._post_calibracao(maior_erro="abc")

        self.assertEqual(response.status_code, 400)
        self.assertIn("maior_erro", response.data)
