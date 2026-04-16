from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from clientes.models import Cliente, Empresa
from instrumentos.models import InstrumentoDoCliente, Instrumento, TipoInstrumento, TipoServico

User = get_user_model()


def _make_cliente():
    empresa = Empresa.objects.create(razao_social="Empresa Teste", cnpj="00000000000001")
    return Cliente.objects.create(empresa=empresa)


def _make_instrumento(cliente):
    tipo = TipoInstrumento.objects.create(descricao="Termômetro", fabricante="X", modelo="M1")
    instr = Instrumento.objects.create(
        tipo_de_instrumento=tipo,
        tipo_de_servico=TipoServico.ACREDITADO,
    )
    return InstrumentoDoCliente.objects.create(
        cliente=cliente,
        instrumento=instr,
        tag="TAG-001",
    )


class TipoDeServicoFieldTest(TestCase):
    def setUp(self):
        self.cliente = _make_cliente()
        self.instrumento = _make_instrumento(self.cliente)

    def test_defaults_to_null(self):
        self.assertIsNone(self.instrumento.tipo_de_servico)

    def test_accepts_valid_values(self):
        for value in [TipoServico.ACREDITADO, TipoServico.NAO_ACREDITADO, TipoServico.INTERNO]:
            self.instrumento.tipo_de_servico = value
            self.instrumento.save(update_fields=['tipo_de_servico'])
            self.instrumento.refresh_from_db()
            self.assertEqual(self.instrumento.tipo_de_servico, value)

    def test_available_serializer_exposes_field(self):
        from instrumentos.serializers import InstrumentoDoClienteAvailableSerializer
        self.instrumento.tipo_de_servico = TipoServico.ACREDITADO
        self.instrumento.save(update_fields=['tipo_de_servico'])
        data = InstrumentoDoClienteAvailableSerializer(self.instrumento).data
        self.assertIn('tipo_de_servico', data)
        self.assertEqual(data['tipo_de_servico'], TipoServico.ACREDITADO)

    def test_read_serializer_exposes_field(self):
        from instrumentos.serializers import InstrumentoDoClienteReadSerializer
        self.instrumento.tipo_de_servico = TipoServico.INTERNO
        self.instrumento.save(update_fields=['tipo_de_servico'])
        data = InstrumentoDoClienteReadSerializer(self.instrumento).data
        self.assertEqual(data['tipo_de_servico'], TipoServico.INTERNO)


class AdicionarInstrumentoTipoDeServicoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        user = User.objects.create_user(username='staff', password='pass', is_staff=True)
        empresa = Empresa.objects.create(razao_social="Empresa 2", cnpj="00000000000002")
        self.cliente = Cliente.objects.create(empresa=empresa)
        user.clientes.add(self.cliente)
        self.api.force_authenticate(user=user)
        self.instrumento = _make_instrumento(self.cliente)
        # Give this instrument a unique tag so it doesn't conflict
        self.instrumento.tag = 'TAG-002'
        self.instrumento.save(update_fields=['tag'])

    def _create_proposta(self):
        from propostas.models import Proposta
        return Proposta.objects.create(cliente=self.cliente)

    def test_persists_tipo_de_servico(self):
        proposta = self._create_proposta()
        resp = self.api.post(
            f'/propostas/{proposta.id}/adicionar_instrumento/',
            {'instrumentos': [{'id': self.instrumento.id, 'service_kind': 'calibracao', 'local': 'P', 'tipo_de_servico': TipoServico.NAO_ACREDITADO}]},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.tipo_de_servico, TipoServico.NAO_ACREDITADO)

    def test_null_tipo_de_servico_does_not_overwrite_existing(self):
        self.instrumento.tipo_de_servico = TipoServico.ACREDITADO
        self.instrumento.save(update_fields=['tipo_de_servico'])
        proposta = self._create_proposta()
        resp = self.api.post(
            f'/propostas/{proposta.id}/adicionar_instrumento/',
            {'instrumentos': [{'id': self.instrumento.id, 'service_kind': 'calibracao', 'local': 'P'}]},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.tipo_de_servico, TipoServico.ACREDITADO)

    def test_invalid_tipo_de_servico_returns_400(self):
        proposta = self._create_proposta()
        resp = self.api.post(
            f'/propostas/{proposta.id}/adicionar_instrumento/',
            {'instrumentos': [{'id': self.instrumento.id, 'service_kind': 'calibracao', 'local': 'P', 'tipo_de_servico': 'invalid'}]},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
