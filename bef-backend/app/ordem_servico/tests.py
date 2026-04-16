from unittest.mock import MagicMock
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from .models import OrdemServico, StatusOS, TipoOS
from .utils import agrupar_instrumentos_os
from propostas.models import Proposta
from instrumentos.models import TipoServico


User = get_user_model()


def _make_instrumento_mock(tipo_de_servico):
    """Return a mock InstrumentoDoCliente with given tipo_de_servico."""
    inst = MagicMock()
    inst.tipo_de_servico = tipo_de_servico
    # instrumento.instrumento.tipo_de_instrumento.descricao — used by is_instrumento_balanca
    inst.instrumento.tipo_de_instrumento.descricao = "Termômetro"
    return inst


class AgruparInstrumentosOSTipoServicoTest(TestCase):
    """
    Grouping uses InstrumentoDoCliente.tipo_de_servico as the key dimension.
    Verify that:
    - all-acreditado instruments group together under 'A'
    - all-nao_acreditado instruments group together under 'NA'
    - mixed instruments land in separate groups
    - null tipo_de_servico defaults to NAO_ACREDITADO
    - base Instrumento.tipo_de_servico is NOT consulted (mock has wrong value there)
    """

    def _make_data(self, tipo_de_servico, local='P', service_kind='calibracao'):
        instrumento = _make_instrumento_mock(tipo_de_servico)
        # Set the BASE instrument's tipo_de_servico to the opposite value — confirms we're NOT reading it
        instrumento.instrumento.tipo_de_servico = (
            TipoServico.NAO_ACREDITADO if tipo_de_servico == TipoServico.ACREDITADO else TipoServico.ACREDITADO
        )
        return {'instrumento': instrumento, 'local': local, 'service_kind': service_kind}

    def test_all_acreditado_single_group(self):
        data = [
            self._make_data(TipoServico.ACREDITADO),
            self._make_data(TipoServico.ACREDITADO),
        ]
        grupos = agrupar_instrumentos_os(data)
        self.assertEqual(len(grupos), 1)
        key = list(grupos.keys())[0]
        self.assertIn(TipoServico.ACREDITADO, key)

    def test_all_nao_acreditado_single_group(self):
        data = [
            self._make_data(TipoServico.NAO_ACREDITADO),
            self._make_data(TipoServico.NAO_ACREDITADO),
        ]
        grupos = agrupar_instrumentos_os(data)
        self.assertEqual(len(grupos), 1)
        key = list(grupos.keys())[0]
        self.assertIn(TipoServico.NAO_ACREDITADO, key)

    def test_mixed_instruments_two_groups(self):
        data = [
            self._make_data(TipoServico.ACREDITADO),
            self._make_data(TipoServico.NAO_ACREDITADO),
        ]
        grupos = agrupar_instrumentos_os(data)
        self.assertEqual(len(grupos), 2)

    def test_null_tipo_de_servico_defaults_to_nao_acreditado(self):
        data = [self._make_data(None)]
        grupos = agrupar_instrumentos_os(data)
        key = list(grupos.keys())[0]
        self.assertIn(TipoServico.NAO_ACREDITADO, key)

    def test_interno_treated_as_its_own_value(self):
        data = [self._make_data(TipoServico.INTERNO)]
        grupos = agrupar_instrumentos_os(data)
        key = list(grupos.keys())[0]
        self.assertIn(TipoServico.INTERNO, key)




class OrdemServicoUpdateStatusTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create a user in "gerente" group so they can update OS
        from django.contrib.auth.models import Group

        self.user = User.objects.create_user(
            username="gerente",
            password="password123",
            is_staff=True,
        )
        gerente_group, _ = Group.objects.get_or_create(name="gerente")
        self.user.groups.add(gerente_group)

        self.client.force_authenticate(user=self.user)

        # Minimal proposta to satisfy FK (assumes basic fields)
        # Adjust field names if necessary to match Proposta model.
        self.proposta = Proposta.objects.create(
            numero="P-001",
        )

        self.os = OrdemServico.objects.create(
            proposta=self.proposta,
            numero="P-001-OS-CAL-001",
            tipo_os=None,
            status=StatusOS.A_REALIZAR,
        )

    def _update_os(self, status_before):
        self.os.status = status_before
        self.os.save(update_fields=["status"])

        response = self.client.patch(
            f"/api/ordens-servico/{self.os.id}/",
            {"data_expiracao": "2030-01-01"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.os.refresh_from_db()
        return self.os.status

    def test_update_from_a_realizar_sets_em_andamento(self):
        final_status = self._update_os(StatusOS.A_REALIZAR)
        self.assertEqual(final_status, StatusOS.EM_ANDAMENTO)

    def test_update_from_em_andamento_keeps_em_andamento(self):
        final_status = self._update_os(StatusOS.EM_ANDAMENTO)
        self.assertEqual(final_status, StatusOS.EM_ANDAMENTO)

    def test_update_from_realizado_sets_em_andamento(self):
        final_status = self._update_os(StatusOS.REALIZADO)
        self.assertEqual(final_status, StatusOS.EM_ANDAMENTO)

    def test_update_from_cancelado_sets_em_andamento(self):
        final_status = self._update_os(StatusOS.CANCELADO)
        self.assertEqual(final_status, StatusOS.EM_ANDAMENTO)


class OrdemServicoStatusActionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        from django.contrib.auth.models import Group

        self.user = User.objects.create_user(
            username="gerente2",
            password="password123",
            is_staff=True,
        )
        gerente_group, _ = Group.objects.get_or_create(name="gerente")
        self.user.groups.add(gerente_group)

        self.client.force_authenticate(user=self.user)

        self.proposta = Proposta.objects.create(
            numero="P-002",
        )

        self.os = OrdemServico.objects.create(
            proposta=self.proposta,
            numero="P-002-OS-CAL-001",
            tipo_os=None,
            status=StatusOS.A_REALIZAR,
        )

    def _call_status_action(self, initial_status, new_status):
        self.os.status = initial_status
        self.os.save(update_fields=["status"])

        response = self.client.patch(
            f"/api/ordens-servico/{self.os.id}/atualizar-status/",
            {"status": new_status},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.os.refresh_from_db()
        return self.os.status

    def test_status_action_can_set_any_status_from_any_status(self):
        # AR -> RE
        final_status = self._call_status_action(StatusOS.A_REALIZAR, StatusOS.REALIZADO)
        self.assertEqual(final_status, StatusOS.REALIZADO)

        # RE -> CA
        final_status = self._call_status_action(StatusOS.REALIZADO, StatusOS.CANCELADO)
        self.assertEqual(final_status, StatusOS.CANCELADO)

        # CA -> EA
        final_status = self._call_status_action(StatusOS.CANCELADO, StatusOS.EM_ANDAMENTO)
        self.assertEqual(final_status, StatusOS.EM_ANDAMENTO)


class OrdemServicoManutencaoDataTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        from django.contrib.auth.models import Group

        self.user = User.objects.create_user(
            username="gerente3",
            password="password123",
            is_staff=True,
        )
        gerente_group, _ = Group.objects.get_or_create(name="gerente")
        self.user.groups.add(gerente_group)

        self.client.force_authenticate(user=self.user)

        self.proposta = Proposta.objects.create(
            numero="P-003",
        )

        self.os = OrdemServico.objects.create(
            proposta=self.proposta,
            numero="P-003-OS-MAN-001",
            tipo_os=TipoOS.MANUTENCAO,
            status=StatusOS.A_REALIZAR,
        )

    def test_update_manutencao_requires_receipt_date(self):
        response = self.client.patch(
            f"/api/ordens-servico/{self.os.id}/",
            {
                "data_expiracao": "2030-01-01",
                # missing data_recebimento_os_manutencao
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("data_recebimento_os_manutencao", response.data)

    def test_update_manutencao_with_receipt_date_succeeds(self):
        response = self.client.patch(
            f"/api/ordens-servico/{self.os.id}/",
            {
                "data_expiracao": "2030-01-01",
                "data_recebimento_os_manutencao": "2030-01-02",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.os.refresh_from_db()
        self.assertIsNotNone(self.os.data_recebimento_os_manutencao)

