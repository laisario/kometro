import os
from urllib.parse import urljoin

from django.conf import settings
from django.core.exceptions import SuspiciousOperation
from django.utils.encoding import filepath_to_uri
from storages.utils import clean_name, safe_join
from storages.backends.s3boto3 import S3Boto3Storage


def _strip_known_media_prefix(name):
    clean = str(name).lstrip("/")
    media_location = str(getattr(settings, "AWS_MEDIA_LOCATION", "")).strip("/")
    legacy_location = str(getattr(settings, "AWS_LEGACY_MEDIA_LOCATION", "")).strip("/")

    for prefix in (media_location, legacy_location):
        if prefix and clean.startswith(f"{prefix}/"):
            return clean[len(prefix) + 1 :]

    return clean


class MediaStorage(S3Boto3Storage):
    location = "media"
    file_overwrite = False
    default_acl = "public-read"
    querystring_auth = False

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("location", getattr(settings, "AWS_MEDIA_LOCATION", self.location))
        super().__init__(*args, **kwargs)
        self.default_acl = getattr(settings, "AWS_DEFAULT_ACL", self.default_acl)
        self.querystring_auth = getattr(
            settings,
            "AWS_QUERYSTRING_AUTH",
            self.querystring_auth,
        )

    def _normalize_name(self, name):
        clean = clean_name(name)
        location = str(self.location or "").strip("/")
        if location and clean.startswith(f"{location}/"):
            return clean

        clean = _strip_known_media_prefix(clean)

        try:
            return safe_join(self.location, clean)
        except ValueError:
            raise SuspiciousOperation("Attempted access to '%s' denied." % name)

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
            clean_name = filepath_to_uri(_strip_known_media_prefix(name))
            return urljoin(media_url.rstrip("/") + "/", clean_name)

        return super().url(
            name,
            parameters=parameters,
            expire=expire,
            http_method=http_method,
        )


class StaticStorage(S3Boto3Storage):
    location = "static"
    default_acl = "public-read"
    querystring_auth = False

    def url(self, name, parameters=None, expire=None, http_method=None):
        if not name:
            return ""

        static_url = getattr(settings, "STATIC_URL", "")
        if static_url.startswith(("http://", "https://")):
            clean_name = filepath_to_uri(str(name).lstrip("/"))
            return urljoin(static_url.rstrip("/") + "/", clean_name)

        return super().url(
            name,
            parameters=parameters,
            expire=expire,
            http_method=http_method,
        )


class BlogPublicMediaStorage(MediaStorage):
    default_acl = "public-read"
    querystring_auth = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.default_acl = "public-read"
        self.querystring_auth = False


class MinIOMediaStorage(S3Boto3Storage):
    location = "media"
    file_overwrite = False

    def url(self, name):
        public_endpoint = os.getenv("MINIO_PUBLIC_ENDPOINT", "http://localhost:9000")
        bucket = os.getenv("MINIO_BUCKET_NAME", "kometro-local")
        clean_name = name.lstrip("/")
        return f"{public_endpoint}/{bucket}/{self.location}/{clean_name}"
