import os

from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    location = "media"
    file_overwrite = False


class MinIOMediaStorage(S3Boto3Storage):
    location = "media"
    file_overwrite = False

    def url(self, name):
        public_endpoint = os.getenv("MINIO_PUBLIC_ENDPOINT", "http://localhost:9000")
        bucket = os.getenv("MINIO_BUCKET_NAME", "kometro-local")
        clean_name = name.lstrip("/")
        return f"{public_endpoint}/{bucket}/{self.location}/{clean_name}"
