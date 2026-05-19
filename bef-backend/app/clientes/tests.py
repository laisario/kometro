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
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id, "origin": "access_page"}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn("convite_url", resp.data)
        convite = Convite.objects.get(id=resp.data["convite"]["id"])
        self.assertIsNone(convite.cliente)

    def test_staff_invite_uses_provided_cliente(self):
        """When staff provides cliente_id, use that client for the invite."""
        cliente = _make_cliente("2")
        resp = self.api.post(
            "/invites/create/",
            {"grupo": self.grupo.id, "cliente": cliente.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        convite = Convite.objects.get(id=resp.data["convite"]["id"])
        self.assertEqual(convite.cliente, cliente)

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

    def test_staff_access_page_invite_creates_staff_user(self):
        """Staff from access_page can create staff invite."""
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id, "origin": "access_page"}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        token = resp.data["convite_url"].split("/")[-1]

        anon = APIClient()
        reg = anon.post(
            f"/invites/register/{token}/",
            {"first_name": "Novo", "username": "novo2@k.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(reg.status_code, 200, reg.data)
        new_user = User.objects.get(username="novo2@k.com")
        self.assertTrue(new_user.is_staff)

    def test_staff_client_page_invite_never_creates_staff_user(self):
        """Staff from client page cannot create staff invite - invited user is always client."""
        cliente = _make_cliente("3")
        resp = self.api.post(
            "/invites/create/",
            {"grupo": self.grupo.id, "cliente": cliente.id, "origin": "client_page"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        token = resp.data["convite_url"].split("/")[-1]

        anon = APIClient()
        reg = anon.post(
            f"/invites/register/{token}/",
            {"first_name": "Novo", "username": "novo3@k.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(reg.status_code, 200, reg.data)
        new_user = User.objects.get(username="novo3@k.com")
        self.assertFalse(new_user.is_staff)


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

    def test_client_user_invite_infers_cliente_from_single_client(self):
        """When client user has exactly one client and sends no cliente, infer from user."""
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        convite = Convite.objects.get(id=resp.data["convite"]["id"])
        self.assertEqual(convite.cliente, self.cliente)

    def test_client_user_with_multiple_clients_requires_cliente(self):
        """When client user has multiple clients and sends no cliente, return 400."""
        outro_cliente = _make_cliente("B")
        self.client_user.clientes.add(outro_cliente)
        resp = self.api.post("/invites/create/", {"grupo": self.grupo.id}, format="json")
        self.assertEqual(resp.status_code, 400)


from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from clientes.models import Cliente, Empresa, Convite
from enderecos.models import UF, Cidade, Bairro, Endereco


class ClienteUpdateAPITestCase(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='admin_update',
            password='adminpass',
            is_staff=True
        )
        
        self.uf = UF.objects.create(sigla="SP")
        self.cidade = Cidade.objects.create(uf=self.uf, nome="São Paulo")
        self.bairro = Bairro.objects.create(cidade=self.cidade, nome="Centro")
        self.endereco = Endereco.objects.create(
            cep="01001000",
            numero=100,
            bairro=self.bairro,
            logradouro="Rua Principal"
        )
        self.empresa = Empresa.objects.create(
            razao_social="Empresa Original",
            cnpj="12345678000100",
            ie="123456"
        )
        self.cliente = Cliente.objects.create(
            empresa=self.empresa,
            endereco=self.endereco,
            criterio_frequencia_padrao="C"
        )

    def test_update_client_empresa(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Atualizada",
                "cnpj": "12345678000100",
                "ie": "654321"
            },
            "criterio_frequencia_padrao": "C"
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['empresa']['razao_social'], "Empresa Atualizada")
        
        self.empresa.refresh_from_db()
        self.assertEqual(self.empresa.razao_social, "Empresa Atualizada")

    def test_update_client_criterio(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "criterio_frequencia_padrao": "S"
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['criterio_frequencia_padrao'], "S")
        
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.criterio_frequencia_padrao, "S")

    def test_update_client_endereco(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Vila Madalena",
                "logradouro": "Rua Nova",
                "numero": 200,
                "cep": "05412000"
            }
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.endereco.bairro.cidade.uf.sigla, "SP")
        self.assertEqual(self.cliente.endereco.bairro.cidade.nome, "São Paulo")
        self.assertEqual(self.cliente.endereco.bairro.nome, "Vila Madalena")

    def test_update_client_endereco_uf_only(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "endereco": {
                "uf": "MG"
            }
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.endereco.bairro.cidade.uf.sigla, "MG")

    def test_update_client_with_nested_empresa(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Editada Ltda",
                "cnpj": "12345678000100",
                "nome_fantasia": "Nome Fantasia"
            }
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.empresa.refresh_from_db()
        self.assertEqual(self.empresa.razao_social, "Empresa Editada Ltda")
        self.assertEqual(self.empresa.nome_fantasia, "Nome Fantasia")

    def test_update_client_without_usuarios_works(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Teste",
                "cnpj": "12345678000100"
            }
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_does_not_clear_unrelated_fields(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "criterio_frequencia_padrao": "S"
        }
        response = self.client.patch(f'/clientes/{self.cliente.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['empresa']['razao_social'], "Empresa Original")


class ClienteCreateAPITestCase(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True
        )
        self.non_staff_user = User.objects.create_user(
            username='user',
            password='userpass',
            is_staff=False
        )
        self.client = APIClient()

    def test_create_client_with_empresa_and_endereco_success(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Teste Ltda",
                "cnpj": "12345678000100",
                "ie": "123456789",
                "nome_fantasia": "Empresa Teste",
                "filial": "Filial principal",
                "isento": False
            },
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Centro",
                "logradouro": "Rua Principal",
                "numero": 100,
                "complemento": "Sala 1",
                "cep": "01001000"
            },
            "criterio_frequencia_padrao": "C"
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data.get('id'))
        self.assertEqual(response.data['empresa']['razao_social'], "Empresa Teste Ltda")
        self.assertEqual(response.data['criterio_frequencia_padrao'], "C")

    def test_create_client_reuses_existing_empresa(self):
        existing_empresa = Empresa.objects.create(
            razao_social="Empresa Existente Ltda",
            cnpj="98765432000100",
            ie="111222333"
        )
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Nova Razão Social",
                "cnpj": "98765432000100",
                "ie": "111222333"
            },
            "endereco": {
                "uf": "RJ",
                "cidade": "Rio de Janeiro",
                "bairro": "Botafogo",
                "logradouro": "Rua das Laranjeiras",
                "numero": 50,
                "cep": "22030010"
            },
            "criterio_frequencia_padrao": "C"
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        empresa_count = Empresa.objects.filter(cnpj="98765432000100").count()
        self.assertEqual(empresa_count, 1)

    def test_create_client_reuses_existing_endereco(self):
        uf = UF.objects.create(sigla="SP")
        cidade = Cidade.objects.create(uf=uf, nome="São Paulo")
        bairro = Bairro.objects.create(cidade=cidade, nome="Vila Madalena")
        existing_endereco = Endereco.objects.create(
            cep="05412000",
            numero=200,
            bairro=bairro,
            logradouro="Rua dolim"
        )
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Endereco Ltda",
                "cnpj": "55555578000100"
            },
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Vila Madalena",
                "logradouro": "Rua dolim",
                "numero": 200,
                "cep": "05412000"
            },
            "criterio_frequencia_padrao": "C"
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        endereco_count = Endereco.objects.filter(
            cep="05412000",
            numero=200,
            logradouro="Rua dolim"
        ).count()
        self.assertEqual(endereco_count, 1)

    def test_create_client_without_empresa_fails(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {},
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Centro",
                "logradouro": "Rua Principal",
                "numero": 100,
                "cep": "01001000"
            }
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_client_without_endereco_fails(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Teste Ltda",
                "cnpj": "12345678000100"
            },
            "endereco": {}
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_client_fails_without_empresa_fields(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": ""
            },
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Centro",
                "logradouro": "Rua Principal",
                "numero": 100,
                "cep": "01001000"
            }
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_client_defaults_criterio_to_calendario(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Calendario Ltda",
                "cnpj": "11111178000100"
            },
            "endereco": {
                "uf": "MG",
                "cidade": "Belo Horizonte",
                "bairro": "Savassi",
                "logradouro": "Av. Afonso Pena",
                "numero": 1000,
                "cep": "30130000"
            }
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['criterio_frequencia_padrao'], "C")

    def test_non_staff_cannot_create_client(self):
        self.client.force_authenticate(user=self.non_staff_user)
        data = {
            "empresa": {
                "razao_social": "Empresa Ltda",
                "cnpj": "00000000000100"
            },
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Centro",
                "logradouro": "Rua",
                "numero": 1,
                "cep": "01000000"
            }
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_client(self):
        data = {
            "empresa": {
                "razao_social": "Empresa Ltda",
                "cnpj": "00000000000100"
            },
            "endereco": {
                "uf": "SP",
                "cidade": "São Paulo",
                "bairro": "Centro",
                "logradouro": "Rua",
                "numero": 1,
                "cep": "01000000"
            }
        }
        response = self.client.post('/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ClienteRemoveUserTestCase(TestCase):
    def setUp(self):
        from enderecos.models import UF, Cidade, Bairro, Endereco

        self.uf = UF.objects.create(sigla="SP")
        self.cidade = Cidade.objects.create(uf=self.uf, nome="São Paulo")
        self.bairro = Bairro.objects.create(cidade=self.cidade, nome="Centro")

        self.staff_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True
        )
        self.client_user = User.objects.create_user(
            username='clientuser',
            password='clientpass',
            is_staff=False
        )
        self.non_staff_user = User.objects.create_user(
            username='user',
            password='userpass',
            is_staff=False
        )
        self.empresa = Empresa.objects.create(
            razao_social="Empresa Teste Ltda",
            cnpj="12345678000100"
        )
        self.endereco = Endereco.objects.create(
            cep="01001000",
            numero=100,
            bairro=self.bairro,
            logradouro="Rua Teste"
        )
        self.cliente = Cliente.objects.create(
            empresa=self.empresa,
            endereco=self.endereco
        )
        self.cliente.usuarios.add(self.client_user)
        self.api_client = APIClient()

    def test_remove_user_from_client_success(self):
        self.api_client.force_authenticate(user=self.staff_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.cliente.usuarios.filter(pk=self.client_user.id).exists())
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.is_active)

    def test_remove_user_not_linked_to_client(self):
        self.api_client.force_authenticate(user=self.staff_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.non_staff_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_remove_self(self):
        self.cliente.usuarios.add(self.staff_user)
        self.api_client.force_authenticate(user=self.staff_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.staff_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Não é possível remover seu próprio acesso", response.data["detail"])

    def test_non_staff_cannot_remove_user(self):
        self.api_client.force_authenticate(user=self.non_staff_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_remove_user(self):
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_gerente_can_remove_user_from_same_client(self):
        gerente_group = Group.objects.get_or_create(name="gerente")[0]
        gerente_user = User.objects.create_user(
            username='gerente_test',
            password='gerentepass',
            is_staff=False
        )
        gerente_user.groups.add(gerente_group)
        self.cliente.usuarios.add(gerente_user)
        self.cliente.usuarios.add(self.client_user)
        
        self.api_client.force_authenticate(user=gerente_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_gerente_cannot_remove_user_from_another_client(self):
        gerente_group = Group.objects.get_or_create(name="gerente")[0]
        gerente_user = User.objects.create_user(
            username='gerente_outro',
            password='gerentepass',
            is_staff=False
        )
        gerente_user.groups.add(gerente_group)
        
        outro_empresa = Empresa.objects.create(
            razao_social="Empresa Outro Cliente",
            cnpj="99999999000199"
        )
        outro_cliente = Cliente.objects.create(
            empresa=outro_empresa,
            endereco=self.endereco
        )
        outro_cliente.usuarios.add(gerente_user)
        outro_cliente.usuarios.add(self.client_user)
        
        self.api_client.force_authenticate(user=gerente_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_gerente_non_staff_cannot_remove_user(self):
        registrador_group = Group.objects.get_or_create(name="registrador")[0]
        registrador_user = User.objects.create_user(
            username='registrador_test',
            password='registradorpass',
            is_staff=False
        )
        registrador_user.groups.add(registrador_group)
        self.cliente.usuarios.add(registrador_user)
        self.cliente.usuarios.add(self.client_user)
        
        self.api_client.force_authenticate(user=registrador_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_gerente_cannot_remove_self(self):
        gerente_group = Group.objects.get_or_create(name="gerente")[0]
        gerente_user = User.objects.create_user(
            username='gerente_self',
            password='gerentepass',
            is_staff=False
        )
        gerente_user.groups.add(gerente_group)
        self.cliente.usuarios.add(gerente_user)
        
        self.api_client.force_authenticate(user=gerente_user)
        response = self.api_client.delete(f'/clientes/{self.cliente.id}/usuarios/{gerente_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Não é possível remover seu próprio acesso", response.data["detail"])


class UserAdminSoftDeleteTestCase(APITestCase):
    def setUp(self):
        self.api_client = APIClient()
        self.staff_user = User.objects.create_user(
            username='admin_soft_delete',
            password='adminpass',
            is_staff=True
        )
        self.target_user = User.objects.create_user(
            username='target_soft_delete',
            password='targetpass',
            is_staff=False
        )

    def test_destroy_soft_deletes_user(self):
        self.api_client.force_authenticate(user=self.staff_user)
        response = self.api_client.delete(f'/users/{self.target_user.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_active)
        self.assertTrue(User.objects.filter(pk=self.target_user.pk).exists())

    def test_inactive_users_are_not_listed(self):
        self.target_user.is_active = False
        self.target_user.save(update_fields=["is_active"])
        self.api_client.force_authenticate(user=self.staff_user)

        response = self.api_client.get('/users/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        user_ids = [user["id"] for user in results]
        self.assertNotIn(self.target_user.id, user_ids)

    def test_soft_delete_preserves_invites_created_by_user(self):
        group = Group.objects.get_or_create(name="gerente")[0]
        convite = Convite.objects.create(
            token_jti="soft-delete-invite",
            grupo=group,
            criado_por=self.target_user,
        )
        self.api_client.force_authenticate(user=self.staff_user)

        response = self.api_client.delete(f'/users/{self.target_user.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        convite.refresh_from_db()
        self.assertIsNone(convite.criado_por)
        self.assertTrue(Convite.objects.filter(pk=convite.pk).exists())


class ConviteListAPITestCase(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='admin_invite',
            password='adminpass',
            is_staff=True
        )
        self.non_staff_user = User.objects.create_user(
            username='user_invite',
            password='userpass',
            is_staff=False
        )
        
        self.uf = UF.objects.create(sigla="SP")
        self.cidade = Cidade.objects.create(uf=self.uf, nome="São Paulo")
        self.bairro = Bairro.objects.create(cidade=self.cidade, nome="Centro")
        self.endereco = Endereco.objects.create(
            cep="01001000",
            numero=100,
            bairro=self.bairro,
            logradouro="Rua Principal"
        )
        self.empresa = Empresa.objects.create(
            razao_social="Empresa Convite",
            cnpj="12345678000100"
        )
        self.cliente = Cliente.objects.create(
            empresa=self.empresa,
            endereco=self.endereco
        )
        
        self.convite = Convite.objects.create(
            token_jti="test-jti-123",
            grupo_id=1,
            criado_por=self.staff_user,
            cliente=self.cliente
        )
        
        self.client = APIClient()

    def test_list_convites_includes_convite_url(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/convites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('convite_url', response.data['results'][0])
        self.assertIn('register/invite/', response.data['results'][0]['convite_url'])

    def test_list_convites_filtered_by_cliente(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(f'/convites/?cliente={self.cliente.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for invite in response.data['results']:
            self.assertEqual(invite['cliente'], self.cliente.id)

    def test_list_convites_filtered_excludes_other_clientes(self):
        self.client.force_authenticate(user=self.staff_user)
        outro_empresa = Empresa.objects.create(
            razao_social="Empresa Outro",
            cnpj="99999999000100"
        )
        outro_cliente = Cliente.objects.create(
            empresa=outro_empresa,
            endereco=self.endereco
        )
        Convite.objects.create(
            token_jti="test-jti-outro",
            grupo_id=1,
            criado_por=self.staff_user,
            cliente=outro_cliente
        )
        response = self.client.get(f'/convites/?cliente={self.cliente.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['cliente'], self.cliente.id)

    def test_list_convites_without_filter_returns_all(self):
        self.client.force_authenticate(user=self.staff_user)
        outro_empresa = Empresa.objects.create(
            razao_social="Empresa Outro Sem Filtro",
            cnpj="88888888000100"
        )
        outro_cliente = Cliente.objects.create(
            empresa=outro_empresa,
            endereco=self.endereco
        )
        Convite.objects.create(
            token_jti="test-jti-sem-filtro",
            grupo_id=1,
            criado_por=self.staff_user,
            cliente=outro_cliente
        )
        response = self.client.get('/convites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 2)

    def test_non_staff_cannot_list_convites(self):
        self.client.force_authenticate(user=self.non_staff_user)
        response = self.client.get('/convites/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ConviteCreateAPITestCase(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='admin_create',
            password='adminpass',
            is_staff=True
        )
        
        self.uf = UF.objects.create(sigla="SP")
        self.cidade = Cidade.objects.create(uf=self.uf, nome="São Paulo")
        self.bairro = Bairro.objects.create(cidade=self.cidade, nome="Centro")
        self.endereco = Endereco.objects.create(
            cep="01001000",
            numero=100,
            bairro=self.bairro,
            logradouro="Rua Principal"
        )
        self.empresa = Empresa.objects.create(
            razao_social="Empresa Convite Create",
            cnpj="12345678000100"
        )
        self.cliente = Cliente.objects.create(
            empresa=self.empresa,
            endereco=self.endereco
        )
        
        self.group = Group.objects.create(name="TestGroup")
        
        self.client = APIClient()

    def test_create_invite_generates_token(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post('/invites/create/', {
            "grupo": self.group.id,
            "cliente": self.cliente.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('convite_url', response.data)
        self.assertIn('convite', response.data)
        
        invite_data = response.data['convite']
        self.assertTrue(invite_data['token'], "Token should not be empty")
        self.assertTrue(invite_data['token_jti'], "Token JTI should not be empty")
        
        self.assertIn(invite_data['token'], response.data['convite_url'])

    def test_create_invite_url_contains_token(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post('/invites/create/', {
            "grupo": self.group.id,
            "cliente": self.cliente.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        convite_url = response.data['convite_url']
        self.assertTrue(convite_url.endswith(f"/register/invite/"))
        
        invite_data = response.data['convite']
        self.assertIn(invite_data['token'], convite_url)
        
        expected_url = f"http://localhost:5173/#/register/invite/{invite_data['token']}"
        self.assertEqual(convite_url, expected_url)

    def test_create_invite_jti_matches_token_payload(self):
        import jwt as jwt_lib
        from django.conf import settings
        
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post('/invites/create/', {
            "grupo": self.group.id,
            "cliente": self.cliente.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        invite_data = response.data['convite']
        token = invite_data['token']
        token_jti = invite_data['token_jti']
        
        payload = jwt_lib.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        self.assertEqual(payload['jti'], token_jti)
        self.assertEqual(payload['type'], 'invite')
        self.assertEqual(payload['grupo_id'], self.group.id)
        self.assertEqual(payload['cliente_id'], self.cliente.id)

    def test_create_invite_can_be_retrieved(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post('/invites/create/', {
            "grupo": self.group.id,
            "cliente": self.cliente.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        invite_data = response.data['convite']
        invite_id = invite_data['id']
        
        get_response = self.client.get(f'/convites/{invite_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data['token'], invite_data['token'])
        self.assertEqual(get_response.data['token_jti'], invite_data['token_jti'])

    def test_non_staff_cannot_create_invite(self):
        non_staff_user = User.objects.create_user(
            username='user_create',
            password='userpass',
            is_staff=False
        )
        self.client.force_authenticate(user=non_staff_user)
        response = self.client.post('/invites/create/', {
            "grupo": self.group.id,
            "cliente": self.cliente.id
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
