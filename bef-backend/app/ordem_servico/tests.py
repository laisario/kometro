from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from .models import OrdemServico, StatusOS, TipoOS
from propostas.models import Proposta


User = get_user_model()


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

