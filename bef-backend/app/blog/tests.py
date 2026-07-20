from unittest.mock import patch

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings

from blog.models import ArquivoPost, Post
from rkp_platform.settings import (
    _canonical_media_location,
    _digitalocean_static_url,
    _join_url_path,
)
from rkp_platform.storage_backends import BlogPublicMediaStorage, MediaStorage, StaticStorage


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

    def test_blog_attachment_field_uses_public_storage(self):
        field = ArquivoPost._meta.get_field("arquivo")

        self.assertIsInstance(field.storage, BlogPublicMediaStorage)

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
