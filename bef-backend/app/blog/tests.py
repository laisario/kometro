from datetime import timedelta
from unittest.mock import patch

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from blog.admin import SolicitacaoAcessoArquivoPostAdmin
from blog.models import ArquivoPost, Post, SolicitacaoAcessoArquivoPost
from rkp_platform.settings import (
    _canonical_media_location,
    _digitalocean_static_url,
    _join_url_path,
)
from rkp_platform.storage_backends import (
    BlogPublicMediaStorage,
    MediaStorage,
    StaticStorage,
)


class InMemoryBlogMediaStorage(BlogPublicMediaStorage):
    """S3-like storage that records normalized object keys without network calls."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.files = {}
        self.saved_keys = []
        self.opened_keys = []
        self.size_keys = []

    def _save(self, name, content):
        normalized_name = self._normalize_name(name)
        self.files[normalized_name] = content.read()
        self.saved_keys.append(normalized_name)
        return name

    def exists(self, name):
        return self._normalize_name(name) in self.files

    def _open(self, name, mode="rb"):
        normalized_name = self._normalize_name(name)
        self.opened_keys.append(normalized_name)
        if normalized_name not in self.files:
            raise FileNotFoundError(f"File does not exist: {normalized_name}")
        return ContentFile(self.files[normalized_name], name=name)

    def size(self, name):
        normalized_name = self._normalize_name(name)
        self.size_keys.append(normalized_name)
        if normalized_name not in self.files:
            raise FileNotFoundError(f"File does not exist: {normalized_name}")
        return len(self.files[normalized_name])


class MediaStorageUrlTests(SimpleTestCase):
    @override_settings(
        MEDIA_URL="https://cdn.example.com/media/",
        AWS_QUERYSTRING_AUTH=False,
        AWS_DEFAULT_ACL="public-read",
    )
    def test_returns_stable_public_url_when_querystring_auth_is_disabled(self):
        storage = MediaStorage()

        url = storage.url("blog/posts/arquivos/Meu arquivo final.pdf")

        self.assertEqual(
            url,
            "https://cdn.example.com/media/blog/posts/arquivos/Meu%20arquivo%20final.pdf",
        )

    @override_settings(
        MEDIA_URL="https://cdn.example.com/media/",
        AWS_QUERYSTRING_AUTH=True,
        AWS_DEFAULT_ACL="private",
        AWS_ACCESS_KEY_ID="test-key",
        AWS_SECRET_ACCESS_KEY="test-secret",
        AWS_STORAGE_BUCKET_NAME="kometro",
        AWS_S3_REGION_NAME="nyc3",
        AWS_S3_ENDPOINT_URL="https://nyc3.digitaloceanspaces.com",
    )
    def test_media_storage_keeps_url_generation_available_when_querystring_auth_is_enabled(self):
        storage = MediaStorage()

        url = storage.url("blog/posts/arquivos/ebook.pdf")

        self.assertTrue(url)

    @override_settings(
        MEDIA_URL="https://cdn.example.com/media/",
        AWS_QUERYSTRING_AUTH=True,
        AWS_DEFAULT_ACL="private",
        AWS_ACCESS_KEY_ID="test-key",
        AWS_SECRET_ACCESS_KEY="test-secret",
        AWS_STORAGE_BUCKET_NAME="kometro",
        AWS_S3_REGION_NAME="nyc3",
        AWS_S3_ENDPOINT_URL="https://nyc3.digitaloceanspaces.com",
    )
    def test_blog_public_storage_ignores_global_signed_url_setting(self):
        storage = BlogPublicMediaStorage()

        url = storage.url("blog/posts/arquivos/ebook.pdf")

        self.assertEqual(url, "https://cdn.example.com/media/blog/posts/arquivos/ebook.pdf")
        self.assertEqual(storage.default_acl, "public-read")
        self.assertFalse(storage.querystring_auth)

    def test_blog_attachment_field_keeps_public_storage(self):
        field = ArquivoPost._meta.get_field("arquivo")

        self.assertIsInstance(field.storage, BlogPublicMediaStorage)
        self.assertEqual(field.storage.default_acl, "public-read")
        self.assertFalse(field.storage.querystring_auth)

    @override_settings(
        MEDIA_URL="https://kometro.nyc3.digitaloceanspaces.com/kometro/media/",
        AWS_MEDIA_LOCATION="kometro/media",
        AWS_QUERYSTRING_AUTH=False,
    )
    def test_media_storage_uses_same_prefix_for_location_and_url(self):
        storage = MediaStorage()

        self.assertEqual(storage.location, "kometro/media")
        self.assertEqual(
            storage._normalize_name("blog/posts/aaaaaaa.jpg"),
            "kometro/media/blog/posts/aaaaaaa.jpg",
        )
        self.assertEqual(
            storage.url("blog/posts/aaaaaaa.jpg"),
            "https://kometro.nyc3.digitaloceanspaces.com/kometro/media/blog/posts/aaaaaaa.jpg",
        )

    @override_settings(
        MEDIA_URL="https://kometro.nyc3.digitaloceanspaces.com/kometro/media/",
        AWS_MEDIA_LOCATION="kometro/media",
        AWS_QUERYSTRING_AUTH=True,
        AWS_DEFAULT_ACL="private",
    )
    def test_blog_public_storage_uses_media_prefix_and_unsigned_public_url(self):
        storage = BlogPublicMediaStorage()

        self.assertEqual(storage.location, "kometro/media")
        self.assertEqual(
            storage._normalize_name("blog/posts/arquivos/file.pdf"),
            "kometro/media/blog/posts/arquivos/file.pdf",
        )
        self.assertEqual(
            storage.url("blog/posts/arquivos/file.pdf"),
            "https://kometro.nyc3.digitaloceanspaces.com/kometro/media/blog/posts/arquivos/file.pdf",
        )
        self.assertEqual(storage.default_acl, "public-read")
        self.assertFalse(storage.querystring_auth)

    @override_settings(
        MEDIA_URL="https://kometro.nyc3.digitaloceanspaces.com/kometro/media/",
        AWS_MEDIA_LOCATION="kometro/media",
        AWS_LEGACY_MEDIA_LOCATION="media",
        AWS_QUERYSTRING_AUTH=False,
    )
    def test_media_storage_does_not_duplicate_prefixed_names(self):
        storage = MediaStorage()

        self.assertEqual(
            storage._normalize_name("kometro/media/blog/posts/cover.jpg"),
            "kometro/media/blog/posts/cover.jpg",
        )
        self.assertEqual(
            storage.url("kometro/media/blog/posts/cover.jpg"),
            "https://kometro.nyc3.digitaloceanspaces.com/kometro/media/blog/posts/cover.jpg",
        )

    @override_settings(
        MEDIA_URL="https://kometro.nyc3.digitaloceanspaces.com/kometro/media/",
        AWS_MEDIA_LOCATION="kometro/media",
        AWS_LEGACY_MEDIA_LOCATION="media",
        AWS_QUERYSTRING_AUTH=False,
    )
    def test_media_storage_generates_canonical_url_for_legacy_prefixed_names(self):
        storage = MediaStorage()

        self.assertEqual(
            storage._normalize_name("media/blog/posts/cover.jpg"),
            "kometro/media/blog/posts/cover.jpg",
        )
        self.assertEqual(
            storage.url("media/blog/posts/cover.jpg"),
            "https://kometro.nyc3.digitaloceanspaces.com/kometro/media/blog/posts/cover.jpg",
        )

    @override_settings(
        STATIC_URL="https://kometro.nyc3.digitaloceanspaces.com/static/",
        AWS_S3_CUSTOM_DOMAIN="kometro.nyc3.cdn.digitaloceanspaces.com/landing-page",
    )
    def test_static_storage_uses_static_url_not_custom_domain(self):
        storage = StaticStorage()

        url = storage.url("admin/css/base.css")

        self.assertEqual(
            url,
            "https://kometro.nyc3.digitaloceanspaces.com/static/admin/css/base.css",
        )

    def test_digitalocean_static_url_adds_bucket_for_path_style_endpoint(self):
        url = _digitalocean_static_url(
            "https://nyc3.digitaloceanspaces.com",
            "kometro",
            "static",
        )

        self.assertEqual(url, "https://nyc3.digitaloceanspaces.com/kometro/static/")

    def test_digitalocean_static_url_does_not_duplicate_bucket_for_virtual_host_endpoint(self):
        url = _digitalocean_static_url(
            "https://kometro.nyc3.digitaloceanspaces.com",
            "kometro",
            "static",
        )

        self.assertEqual(url, "https://kometro.nyc3.digitaloceanspaces.com/static/")

    def test_digitalocean_static_url_does_not_duplicate_bucket_in_endpoint_path(self):
        url = _digitalocean_static_url(
            "https://nyc3.digitaloceanspaces.com/kometro",
            "kometro",
            "static",
        )

        self.assertEqual(url, "https://nyc3.digitaloceanspaces.com/kometro/static/")

    def test_static_url_normalization_collapses_adjacent_duplicate_segments(self):
        url = _join_url_path("https://nyc3.digitaloceanspaces.com/kometro/kometro/static/")

        self.assertEqual(url, "https://nyc3.digitaloceanspaces.com/kometro/static/")

    def test_canonical_media_location_keeps_required_bucket_prefix(self):
        self.assertEqual(_canonical_media_location("media", "kometro"), "kometro/media")
        self.assertEqual(
            _canonical_media_location("kometro/media", "kometro"),
            "kometro/media",
        )


@override_settings(
    MEDIA_URL="https://kometro.nyc3.digitaloceanspaces.com/kometro/media/",
    AWS_MEDIA_LOCATION="kometro/media",
    AWS_QUERYSTRING_AUTH=False,
    AWS_DEFAULT_ACL="public-read",
)
class BlogUploadPathAndVisibilityTests(SimpleTestCase):
    def setUp(self):
        self.featured_storage = InMemoryBlogMediaStorage()
        self.attachment_storage = InMemoryBlogMediaStorage()

        featured_field = Post._meta.get_field("imagem_destaque")
        attachment_field = ArquivoPost._meta.get_field("arquivo")

        self.featured_storage_patcher = patch.object(
            featured_field,
            "storage",
            self.featured_storage,
        )
        self.attachment_storage_patcher = patch.object(
            attachment_field,
            "storage",
            self.attachment_storage,
        )
        self.featured_storage_patcher.start()
        self.attachment_storage_patcher.start()
        self.addCleanup(self.featured_storage_patcher.stop)
        self.addCleanup(self.attachment_storage_patcher.stop)

    def _create_post_with_media(self):
        featured_image = SimpleUploadedFile(
            "cover.jpg",
            b"fake image bytes",
            content_type="image/jpeg",
        )
        ebook = SimpleUploadedFile(
            "ebook.pdf",
            b"%PDF-1.4 fake pdf bytes",
            content_type="application/pdf",
        )

        post = Post(
            id=17,
            titulo="Post com ebook",
            visivel=False,
        )
        post.imagem_destaque.save("cover.jpg", featured_image, save=False)

        arquivo_post = ArquivoPost(
            id=23,
            post=post,
            post_id=post.pk,
        )
        arquivo_post.arquivo.save("ebook.pdf", ebook, save=False)
        self._save_attachment_without_database(arquivo_post)
        return post, arquivo_post

    def _save_attachment_without_database(self, arquivo_post):
        with patch("django.db.models.Model.save", return_value=None), patch(
            "django.db.models.fields.related.ForeignKey.validate",
            return_value=None,
        ), patch(
            "django.db.models.Model.validate_unique",
            return_value=None,
        ), patch(
            "django.db.models.Model.validate_constraints",
            return_value=None,
        ):
            arquivo_post.save()

    def _save_post_and_inline(self, post, arquivo_post):
        with patch("django.db.models.Model.save", return_value=None):
            post.save()
        self._save_attachment_without_database(arquivo_post)

    def test_blog_media_uses_canonical_kometro_media_paths_and_urls(self):
        post, arquivo_post = self._create_post_with_media()

        self.assertEqual(post.imagem_destaque.name, "blog/posts/cover.jpg")
        self.assertEqual(arquivo_post.arquivo.name, "blog/posts/arquivos/ebook.pdf")

        self.assertEqual(
            self.featured_storage.saved_keys,
            ["kometro/media/blog/posts/cover.jpg"],
        )
        self.assertEqual(
            self.attachment_storage.saved_keys,
            ["kometro/media/blog/posts/arquivos/ebook.pdf"],
        )

        self.assertEqual(
            post.imagem_destaque.storage._normalize_name(post.imagem_destaque.name),
            "kometro/media/blog/posts/cover.jpg",
        )
        self.assertEqual(
            arquivo_post.arquivo.storage._normalize_name(arquivo_post.arquivo.name),
            "kometro/media/blog/posts/arquivos/ebook.pdf",
        )
        self.assertNotIn(
            "kometro/media/kometro/media/",
            post.imagem_destaque.storage._normalize_name(post.imagem_destaque.name),
        )
        self.assertNotIn(
            "kometro/media/kometro/media/",
            arquivo_post.arquivo.storage._normalize_name(arquivo_post.arquivo.name),
        )
        self.assertNotEqual(
            post.imagem_destaque.storage._normalize_name(post.imagem_destaque.name),
            "media/blog/posts/cover.jpg",
        )
        self.assertNotEqual(
            arquivo_post.arquivo.storage._normalize_name(arquivo_post.arquivo.name),
            "media/blog/posts/arquivos/ebook.pdf",
        )

        self.assertEqual(
            post.imagem_destaque.url,
            "https://kometro.nyc3.digitaloceanspaces.com/kometro/media/blog/posts/cover.jpg",
        )
        self.assertEqual(
            arquivo_post.arquivo.url,
            "https://kometro.nyc3.digitaloceanspaces.com/kometro/media/blog/posts/arquivos/ebook.pdf",
        )

    def test_saving_post_and_existing_attachment_again_does_not_open_missing_s3_key(self):
        post, arquivo_post = self._create_post_with_media()

        self.attachment_storage.opened_keys.clear()
        self.attachment_storage.size_keys.clear()
        self._save_post_and_inline(post, arquivo_post)

        self.assertEqual(self.attachment_storage.opened_keys, [])
        self.assertEqual(self.attachment_storage.size_keys, [])

    def test_toggling_visivel_does_not_open_missing_s3_key_for_existing_attachment(self):
        post, arquivo_post = self._create_post_with_media()

        self.attachment_storage.opened_keys.clear()
        self.attachment_storage.size_keys.clear()
        post.visivel = True
        self._save_post_and_inline(post, arquivo_post)

        post.visivel = False
        self._save_post_and_inline(post, arquivo_post)

        self.assertEqual(self.attachment_storage.opened_keys, [])
        self.assertEqual(self.attachment_storage.size_keys, [])


class BlogAttachmentAccessTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.storage = InMemoryBlogMediaStorage()
        attachment_field = ArquivoPost._meta.get_field("arquivo")
        self.storage_patcher = patch.object(
            attachment_field,
            "storage",
            self.storage,
        )
        self.storage_patcher.start()
        self.addCleanup(self.storage_patcher.stop)

        self.post = Post.objects.create(
            titulo="Post com material",
            visivel=True,
        )
        self.arquivo = ArquivoPost.objects.create(
            post=self.post,
            arquivo=SimpleUploadedFile(
                "material.pdf",
                b"%PDF-1.4 material",
                content_type="application/pdf",
            ),
            titulo="Material técnico",
        )

    def test_post_publico_nao_expoe_url_direta_do_anexo(self):
        response = self.api.get(f"/posts/{self.post.id}/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data["arquivos"]), 1)
        self.assertNotIn("url", response.data["arquivos"][0])
        self.assertEqual(response.data["arquivos"][0]["id"], self.arquivo.id)

    def test_submissao_valida_e_vinculada_ao_arquivo_retorna_url_existente(self):
        with patch.object(
            self.storage,
            "url",
            return_value="https://files.example.com/material.pdf",
        ) as url_mock:
            response = self.api.post(
                f"/blog/arquivos/{self.arquivo.id}/acesso/",
                {
                    "nome": "Maria da Silva",
                    "empresa": "Empresa Exemplo",
                    "email": "maria@example.com",
                    "telefone": "+55 24 99999-9999",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 201, response.data)
        solicitacao = SolicitacaoAcessoArquivoPost.objects.get()
        self.assertEqual(solicitacao.arquivo, self.arquivo)
        self.assertEqual(solicitacao.nome, "Maria da Silva")
        self.assertEqual(solicitacao.empresa, "Empresa Exemplo")
        self.assertEqual(solicitacao.email, "maria@example.com")
        self.assertEqual(solicitacao.telefone, "+55 24 99999-9999")
        self.assertEqual(response.data["arquivo"], self.arquivo.id)
        self.assertEqual(
            response.data["download_url"],
            "https://files.example.com/material.pdf",
        )
        url_mock.assert_called_once_with(self.arquivo.arquivo.name)

    def test_todos_os_campos_sao_obrigatorios_e_arquivo_nao_e_liberado(self):
        with patch.object(self.storage, "url") as url_mock:
            response = self.api.post(
                f"/blog/arquivos/{self.arquivo.id}/acesso/",
                {},
                format="json",
            )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(
            set(response.data),
            {"nome", "empresa", "email", "telefone"},
        )
        self.assertFalse(SolicitacaoAcessoArquivoPost.objects.exists())
        url_mock.assert_not_called()

    def test_email_invalido_retorna_erro_e_nao_libera_arquivo(self):
        with patch.object(self.storage, "url") as url_mock:
            response = self.api.post(
                f"/blog/arquivos/{self.arquivo.id}/acesso/",
                {
                    "nome": "Maria",
                    "empresa": "Empresa",
                    "email": "email-invalido",
                    "telefone": "24999999999",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("email", response.data)
        self.assertFalse(SolicitacaoAcessoArquivoPost.objects.exists())
        url_mock.assert_not_called()

    def test_anexo_de_post_nao_visivel_nao_pode_ser_liberado(self):
        self.post.visivel = False
        self.post.save(update_fields=["visivel"])

        response = self.api.post(
            f"/blog/arquivos/{self.arquivo.id}/acesso/",
            {
                "nome": "Maria",
                "empresa": "Empresa",
                "email": "maria@example.com",
                "telefone": "24999999999",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404, response.data)
        self.assertFalse(SolicitacaoAcessoArquivoPost.objects.exists())


class BlogAttachmentAccessAdminListTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin_user = get_user_model().objects.create_user(
            username="admin-blog@example.com",
            password="senha-teste",
            is_staff=True,
        )
        self.regular_user = get_user_model().objects.create_user(
            username="cliente-blog@example.com",
            password="senha-teste",
            is_staff=False,
        )
        post = Post.objects.create(titulo="Post administrativo", visivel=True)
        self.arquivo = ArquivoPost.objects.create(
            post=post,
            arquivo="blog/posts/arquivos/material-admin.pdf",
            nome_original="material-admin.pdf",
            titulo="Material administrativo",
            tipo="application/pdf",
            tamanho=123,
        )
        self.solicitacao_antiga = SolicitacaoAcessoArquivoPost.objects.create(
            arquivo=self.arquivo,
            nome="Ana Antiga",
            empresa="Empresa Antiga",
            email="ana@example.com",
            telefone="24999999991",
        )
        self.solicitacao_recente = SolicitacaoAcessoArquivoPost.objects.create(
            arquivo=self.arquivo,
            nome="Bruno Recente",
            empresa="Empresa Recente",
            email="bruno@example.com",
            telefone="24999999992",
        )
        agora = timezone.now()
        SolicitacaoAcessoArquivoPost.objects.filter(
            id=self.solicitacao_antiga.id
        ).update(criado_em=agora - timedelta(days=1))
        SolicitacaoAcessoArquivoPost.objects.filter(
            id=self.solicitacao_recente.id
        ).update(criado_em=agora)
        self.solicitacao_recente.refresh_from_db()

    def test_admin_lista_solicitacoes_paginadas_com_arquivo_data_e_hora(self):
        self.api.force_authenticate(user=self.admin_user)

        response = self.api.get(
            "/solicitacoes-arquivos/",
            {"page": 1, "page_size": 1},
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 1)

        result = response.data["results"][0]
        criado_em_local = timezone.localtime(self.solicitacao_recente.criado_em)
        self.assertEqual(result["nome"], "Bruno Recente")
        self.assertEqual(result["empresa"], "Empresa Recente")
        self.assertEqual(result["email"], "bruno@example.com")
        self.assertEqual(result["telefone"], "24999999992")
        self.assertEqual(result["arquivo"]["id"], self.arquivo.id)
        self.assertEqual(
            result["arquivo"]["nome_original"],
            "material-admin.pdf",
        )
        self.assertEqual(
            result["data_solicitacao"],
            criado_em_local.strftime("%Y-%m-%d"),
        )
        self.assertEqual(
            result["hora_solicitacao"],
            criado_em_local.strftime("%H:%M:%S"),
        )
        self.assertIn("criado_em", result)

    def test_usuario_autenticado_nao_admin_nao_pode_listar_solicitacoes(self):
        self.api.force_authenticate(user=self.regular_user)

        response = self.api.get("/solicitacoes-arquivos/")

        self.assertEqual(response.status_code, 403, response.data)

    def test_usuario_nao_autenticado_nao_pode_listar_solicitacoes(self):
        response = self.api.get("/solicitacoes-arquivos/")

        self.assertEqual(response.status_code, 401, response.data)

    def test_endpoint_administrativo_e_somente_leitura(self):
        self.api.force_authenticate(user=self.admin_user)

        response = self.api.post(
            "/solicitacoes-arquivos/",
            {
                "nome": "Novo",
                "empresa": "Empresa",
                "email": "novo@example.com",
                "telefone": "24999999999",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 405, response.data)


class BlogAttachmentAccessAdminConfigurationTests(SimpleTestCase):
    def test_solicitacao_esta_registrada_como_somente_leitura_no_admin(self):
        model_admin = admin.site._registry[SolicitacaoAcessoArquivoPost]

        self.assertIsInstance(model_admin, SolicitacaoAcessoArquivoPostAdmin)
        self.assertFalse(model_admin.has_add_permission(request=None))
        self.assertFalse(model_admin.has_change_permission(request=None))
        self.assertFalse(model_admin.has_delete_permission(request=None))
