from django.apps import AppConfig


class BlogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "blog"
    _logged_static_media_settings = False

    def ready(self):
        import os
        import blog.signals

        if (
            self.__class__._logged_static_media_settings
            or os.getenv("DEBUG_STATIC_MEDIA_SETTINGS", "false").lower() != "true"
        ):
            return

        self.__class__._logged_static_media_settings = True

        import logging

        from django.conf import settings
        from django.contrib.staticfiles.storage import staticfiles_storage
        from django.core.files.storage import default_storage
        from django.templatetags.static import static

        logger = logging.getLogger(__name__)
        logger.warning(
            "Static/media settings debug: "
            "AWS_STORAGE_BUCKET_NAME=%r, "
            "AWS_S3_ENDPOINT_URL=%r, "
            "AWS_S3_CUSTOM_DOMAIN=%r, "
            "AWS_LOCATION=%r, "
            "STATIC_URL=%r, "
            "MEDIA_URL=%r, "
            "STATIC_ROOT=%r, "
            "STATICFILES_STORAGE=%r, "
            "EFFECTIVE_STATICFILES_STORAGE=%r, "
            "DEFAULT_FILE_STORAGE=%r, "
            "EFFECTIVE_DEFAULT_STORAGE=%r, "
            "STORAGES=%r",
            getattr(settings, "AWS_STORAGE_BUCKET_NAME", None),
            getattr(settings, "AWS_S3_ENDPOINT_URL", None),
            getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None),
            getattr(settings, "AWS_LOCATION", None),
            getattr(settings, "STATIC_URL", None),
            getattr(settings, "MEDIA_URL", None),
            getattr(settings, "STATIC_ROOT", None),
            getattr(settings, "STATICFILES_STORAGE", None),
            f"{staticfiles_storage.__class__.__module__}.{staticfiles_storage.__class__.__name__}",
            getattr(settings, "DEFAULT_FILE_STORAGE", None),
            f"{default_storage.__class__.__module__}.{default_storage.__class__.__name__}",
            getattr(settings, "STORAGES", None),
        )
        logger.warning("ADMIN BASE CSS URL: %s", static("admin/css/base.css"))
        logger.warning("ADMIN DARK MODE CSS URL: %s", static("admin/css/dark_mode.css"))
        logger.warning("ADMIN JS URL: %s", static("admin/js/nav_sidebar.js"))
