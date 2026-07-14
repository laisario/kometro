from django.test import SimpleTestCase, override_settings

from blog.models import ArquivoPost
from rkp_platform.storage_backends import BlogPublicMediaStorage, MediaStorage, StaticStorage


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
