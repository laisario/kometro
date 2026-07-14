import os
from urllib.parse import urljoin

from django.conf import settings
from django.utils.encoding import filepath_to_uri
from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    location = "media"
    file_overwrite = False
    default_acl = "public-read"
    querystring_auth = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.default_acl = getattr(settings, "AWS_DEFAULT_ACL", self.default_acl)
        self.querystring_auth = getattr(
            settings,
            "AWS_QUERYSTRING_AUTH",
            self.querystring_auth,
        )

    def url(self, name, parameters=None, expire=None, http_method=None):
        if not name:
            return ""

        if self.querystring_auth:
            return super().url(
                name,
                parameters=parameters,
                expire=expire,
                http_method=http_method,
            )

        media_url = getattr(settings, "MEDIA_URL", "")
        if media_url.startswith(("http://", "https://")):
            clean_name = filepath_to_uri(str(name).lstrip("/"))
            return urljoin(media_url.rstrip("/") + "/", clean_name)

        return super().url(
            name,
            parameters=parameters,
            expire=expire,
            http_method=http_method,
        )


class MinIOMediaStorage(S3Boto3Storage):
    location = "media"
    file_overwrite = False

    def url(self, name):
        public_endpoint = os.getenv("MINIO_PUBLIC_ENDPOINT", "http://localhost:9000")
        bucket = os.getenv("MINIO_BUCKET_NAME", "kometro-local")
        clean_name = name.lstrip("/")
        return f"{public_endpoint}/{bucket}/{self.location}/{clean_name}"
