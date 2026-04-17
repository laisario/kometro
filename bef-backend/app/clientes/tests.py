from django.test import TestCase
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient
from .models import Cliente, Empresa, Convite


def _make_empresa(suffix="1", cnpj=None):
    return Empresa.objects.create(
        razao_social=f"Empresa {suffix}",
        cnpj=cnpj or f"0000000000000{suffix[-1]}",
    )


def _make_cliente(suffix="1"):
    return Cliente.objects.create(empresa=_make_empresa(suffix))


def _make_group(name):
    group, _ = Group.objects.get_or_create(name=name)
    return group


class CriarConviteStaffTest(TestCase):
    """Staff invite: no client required; invited user becomes staff."""

    def setUp(self):
        self.api = APIClient()
        self.staff_user = User.objects.create_user(
            username="staff@k.com", password="pass", is_staff=True
        )
        self.grupo = _make_group("gerente")
        self.api.force_authenticate(user=self.staff_user)

    def test_staff_can_create_invite_without_client(self):
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn("convite_url", resp.data)
        convite = Convite.objects.get(id=resp.data["convite"]["id"])
        self.assertIsNone(convite.cliente)

    def test_staff_invite_ignores_sent_cliente(self):
        """Even if the frontend mistakenly sends a client, staff invite must ignore it."""
        cliente = _make_cliente("2")
        resp = self.api.post(
            "/invites/create/",
            {"grupo": self.grupo.id, "cliente": cliente.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        convite = Convite.objects.get(id=resp.data["convite"]["id"])
        self.assertIsNone(convite.cliente)

    def test_staff_invite_registration_creates_staff_user_with_no_client(self):
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id}, format="json")
        token = resp.data["convite_url"].split("/")[-1]

        anon = APIClient()
        reg = anon.post(
            f"/invites/register/{token}/",
            {"first_name": "Novo", "username": "novo@k.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(reg.status_code, 200, reg.data)

        new_user = User.objects.get(username="novo@k.com")
        self.assertTrue(new_user.is_staff)
        self.assertFalse(new_user.clientes.exists())


class CriarConviteClienteTest(TestCase):
    """Client invite: must target own client; invited user gets same client."""

    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente("A")
        self.grupo = _make_group("registrador")
        gerente_group = _make_group("gerente")
        self.client_user = User.objects.create_user(
            username="gerente@emp.com", password="pass", is_staff=False
        )
        self.client_user.groups.add(gerente_group)
        self.client_user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.client_user)

    def test_client_user_requires_cliente_id(self):
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_client_user_cannot_invite_to_another_client(self):
        other = _make_cliente("B")
        resp = self.api.post(
            "/invites/create/",
            {"grupo": self.grupo.id, "cliente": other.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_client_invite_registration_associates_correct_client(self):
        resp = self.api.post(
            "/invites/create/",
            {"grupo": self.grupo.id, "cliente": self.cliente.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        token = resp.data["convite_url"].split("/")[-1]

        anon = APIClient()
        reg = anon.post(
            f"/invites/register/{token}/",
            {"first_name": "Maria", "username": "maria@emp.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(reg.status_code, 200, reg.data)

        new_user = User.objects.get(username="maria@emp.com")
        self.assertFalse(new_user.is_staff)
        self.assertTrue(new_user.clientes.filter(id=self.cliente.id).exists())
        # Must not be linked to any other client
        self.assertEqual(new_user.clientes.count(), 1)

    def test_invite_cannot_be_used_twice(self):
        resp = self.api.post(
            "/invites/create/",
            {"grupo": self.grupo.id, "cliente": self.cliente.id},
            format="json",
        )
        token = resp.data["convite_url"].split("/")[-1]
        anon = APIClient()
        anon.post(
            f"/invites/register/{token}/",
            {"first_name": "X", "username": "x@emp.com", "password": "StrongPass123!"},
            format="json",
        )
        resp2 = anon.post(
            f"/invites/register/{token}/",
            {"first_name": "Y", "username": "y@emp.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(resp2.status_code, 400)
