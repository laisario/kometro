from django.test import SimpleTestCase, override_settings

from rkp_platform.storage_backends import MediaStorage


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
    def test_uses_signed_url_flow_when_querystring_auth_is_enabled(self):
        storage = MediaStorage()

        url = storage.url("blog/posts/arquivos/ebook.pdf")

        self.assertIn("X-Amz-Algorithm=", url)
