from unittest.mock import patch
from django.test import TestCase, RequestFactory
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


class WritePropostaSerializerTipoDeServicoTest(TestCase):
    def setUp(self):
        empresa = Empresa.objects.create(razao_social="Empresa 3", cnpj="00000000000003")
        self.cliente = Cliente.objects.create(empresa=empresa)
        self.user = User.objects.create_user(username='client_user', password='pass')
        self.user.clientes.add(self.cliente)
        self.instrumento = _make_instrumento(self.cliente)
        self.instrumento.tag = 'TAG-003'
        self.instrumento.save(update_fields=['tag'])

    def test_create_persists_tipo_de_servico(self):
        from propostas.serializers import WritePropostaSerializer
        request = RequestFactory().post('/')
        request.user = self.user
        serializer = WritePropostaSerializer(
            data={'instrumentos': [{'id': self.instrumento.id, 'service_kind': 'calibracao', 'local': 'P', 'tipo_de_servico': TipoServico.ACREDITADO}]},
            context={'request': request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.tipo_de_servico, TipoServico.ACREDITADO)


class ElaborarPropostaTipoDeServicoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        empresa = Empresa.objects.create(razao_social="Empresa 4", cnpj="00000000000004")
        self.cliente = Cliente.objects.create(empresa=empresa)
        self.user = User.objects.create_user(username='staff2', password='pass', is_staff=True)
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)
        self.instrumento = _make_instrumento(self.cliente)
        self.instrumento.tag = 'TAG-004'
        self.instrumento.save(update_fields=['tag'])
        from propostas.models import Proposta
        self.proposta = Proposta.objects.create(cliente=self.cliente)

    @patch('propostas.views.gerar_pdf_proposta')
    def test_elaborar_persists_tipo_de_servico(self, _mock_pdf):
        resp = self.api.patch(
            f'/propostas/{self.proposta.id}/elaborar/',
            {'cliente': self.cliente.id, 'instrumentos': [{'id': self.instrumento.id, 'service_kind': 'calibracao', 'local': 'P', 'tipo_de_servico': TipoServico.INTERNO}]},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.tipo_de_servico, TipoServico.INTERNO)


class ShouldApplySealTest(TestCase):
    """
    Seal rule: apply seal iff at least one InstrumentoDoCliente in the proposal
    has tipo_de_servico = TipoServico.ACREDITADO ('A').
    Checks InstrumentoDoCliente.tipo_de_servico, NOT the base Instrumento field.
    """

    def setUp(self):
        from propostas.models import Proposta, PropostaInstrumento
        empresa = Empresa.objects.create(razao_social="Empresa Selo", cnpj="00000000000005")
        self.cliente = Cliente.objects.create(empresa=empresa)
        self.PropostaInstrumento = PropostaInstrumento
        self.Proposta = Proposta
        self._tag_counter = 0

    def _make_proposta(self):
        return self.Proposta.objects.create(cliente=self.cliente)

    def _make_instrumento_cliente(self, tipo_de_servico=None):
        self._tag_counter += 1
        tipo = TipoInstrumento.objects.create(
            descricao=f"Instrumento {self._tag_counter}",
            fabricante="F",
            modelo="M",
        )
        instr = Instrumento.objects.create(tipo_de_instrumento=tipo)
        return InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=instr,
            tag=f"TAG-SELO-{self._tag_counter}",
            tipo_de_servico=tipo_de_servico,
        )

    def _link(self, proposta, instrumento_cliente):
        self.PropostaInstrumento.objects.create(
            proposta=proposta,
            instrumento=instrumento_cliente,
            service_kind='calibracao',
            local='P',
        )
        proposta.instrumentos.add(instrumento_cliente)

    def test_all_nao_acreditado_no_seal(self):
        proposta = self._make_proposta()
        self._link(proposta, self._make_instrumento_cliente(TipoServico.NAO_ACREDITADO))
        self._link(proposta, self._make_instrumento_cliente(TipoServico.NAO_ACREDITADO))
        self.assertFalse(proposta.should_apply_seal())

    def test_all_interno_no_seal(self):
        proposta = self._make_proposta()
        self._link(proposta, self._make_instrumento_cliente(TipoServico.INTERNO))
        self.assertFalse(proposta.should_apply_seal())

    def test_one_acreditado_seal_applied(self):
        proposta = self._make_proposta()
        self._link(proposta, self._make_instrumento_cliente(TipoServico.ACREDITADO))
        self.assertTrue(proposta.should_apply_seal())

    def test_mixed_one_acreditado_seal_applied(self):
        proposta = self._make_proposta()
        self._link(proposta, self._make_instrumento_cliente(TipoServico.NAO_ACREDITADO))
        self._link(proposta, self._make_instrumento_cliente(TipoServico.ACREDITADO))
        self.assertTrue(proposta.should_apply_seal())

    def test_null_tipo_de_servico_no_seal(self):
        proposta = self._make_proposta()
        self._link(proposta, self._make_instrumento_cliente(None))
        self.assertFalse(proposta.should_apply_seal())

    def test_base_instrument_acreditado_does_not_trigger_seal(self):
        """InstrumentoDoCliente.tipo_de_servico=None, but base Instrumento.tipo_de_servico=ACREDITADO.
        Seal must NOT apply — the rule uses the customer instrument, not the base."""
        tipo = TipoInstrumento.objects.create(descricao="Base Acred", fabricante="F", modelo="M")
        base_instr = Instrumento.objects.create(
            tipo_de_instrumento=tipo,
            tipo_de_servico=TipoServico.ACREDITADO,
        )
        cliente_instr = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=base_instr,
            tag="TAG-BASE-ACRED",
            tipo_de_servico=None,
        )
        proposta = self._make_proposta()
        self._link(proposta, cliente_instr)
        self.assertFalse(proposta.should_apply_seal())
