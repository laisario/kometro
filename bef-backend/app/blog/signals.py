import logging
import os

from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models.signals import post_save, post_delete, pre_save
from django.db import transaction
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild

logger = logging.getLogger(__name__)


def _storage_label(storage):
    return f"{storage.__class__.__module__}.{storage.__class__.__name__}"


def _log_blog_upload_paths(post=None, arquivo_post=None):
    if os.getenv("DEBUG_BLOG_UPLOAD_PATHS", "false").lower() != "true":
        return

    logger.warning(
        "Blog upload settings debug: "
        "AWS_STORAGE_BUCKET_NAME=%r, "
        "AWS_S3_ENDPOINT_URL=%r, "
        "AWS_S3_CUSTOM_DOMAIN=%r, "
        "AWS_LOCATION=%r, "
        "AWS_MEDIA_LOCATION=%r, "
        "MEDIA_URL=%r, "
        "STATIC_URL=%r, "
        "DEFAULT_FILE_STORAGE=%r, "
        "STATICFILES_STORAGE=%r, "
        "STORAGES=%r, "
        "AWS_QUERYSTRING_AUTH=%r, "
        "AWS_DEFAULT_ACL=%r",
        getattr(settings, "AWS_STORAGE_BUCKET_NAME", None),
        getattr(settings, "AWS_S3_ENDPOINT_URL", None),
        getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None),
        getattr(settings, "AWS_LOCATION", None),
        getattr(settings, "AWS_MEDIA_LOCATION", None),
        getattr(settings, "MEDIA_URL", None),
        getattr(settings, "STATIC_URL", None),
        getattr(settings, "DEFAULT_FILE_STORAGE", None),
        getattr(settings, "STATICFILES_STORAGE", None),
        getattr(settings, "STORAGES", None),
        getattr(settings, "AWS_QUERYSTRING_AUTH", None),
        getattr(settings, "AWS_DEFAULT_ACL", None),
    )

    if post:
        logger.warning("POST ID: %s", post.id)
        if post.imagem_destaque:
            logger.warning("FEATURED IMAGE FIELD: blog.Post.imagem_destaque")
            logger.warning("FEATURED IMAGE UPLOAD_TO: blog/posts/")
            logger.warning("FEATURED IMAGE STORAGE: %s", _storage_label(post.imagem_destaque.storage))
            logger.warning(
                "FEATURED IMAGE STORAGE LOCATION: %s",
                getattr(post.imagem_destaque.storage, "location", None),
            )
            logger.warning("FEATURED IMAGE NAME: %s", post.imagem_destaque.name)
            logger.warning("FEATURED IMAGE URL: %s", post.imagem_destaque.url)

    if arquivo_post:
        logger.warning("POST ID: %s", arquivo_post.post_id)
        logger.warning("ATTACHED FILE FIELD: blog.ArquivoPost.arquivo")
        logger.warning("ATTACHED FILE UPLOAD_TO: blog/posts/arquivos/")
        logger.warning("ATTACHED FILE STORAGE: %s", _storage_label(arquivo_post.arquivo.storage))
        logger.warning(
            "ATTACHED FILE STORAGE LOCATION: %s",
            getattr(arquivo_post.arquivo.storage, "location", None),
        )
        logger.warning("ATTACHED FILE NAME: %s", arquivo_post.arquivo.name)
        logger.warning("ATTACHED FILE URL: %s", arquivo_post.arquivo.url)


@receiver(post_save, sender="blog.Post")
def rebuild_frontend_post(sender, instance, **kwargs):
    """Trigger frontend rebuild when a Post is created or updated."""
    action = "created" if kwargs.get("created", False) else "updated"
    logger.info(f"Post {instance.pk} ({instance.titulo}) {action} - scheduling frontend rebuild")
    _log_blog_upload_paths(post=instance)
    transaction.on_commit(lambda: trigger_frontend_rebuild(post_id=instance.pk, action=action))


@receiver(post_delete, sender="blog.Post")
def rebuild_frontend_post_delete(sender, instance, **kwargs):
    """Trigger frontend rebuild when a Post is deleted."""
    logger.info(f"Post {instance.pk} ({instance.titulo}) deleted - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(post_id=instance.pk, action="deleted"))


@receiver(post_save, sender="blog.Categoria")
def rebuild_frontend_categoria_save(sender, instance, **kwargs):
    """Trigger frontend rebuild when a Categoria is created or updated."""
    action = "created" if kwargs.get("created", False) else "updated"
    logger.info(f"Categoria {instance.pk} ({instance.nome}) {action} - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(categoria_id=instance.pk, action=action))


@receiver(post_delete, sender="blog.Categoria")
def rebuild_frontend_categoria_delete(sender, instance, **kwargs):
    """Trigger frontend rebuild when a Categoria is deleted."""
    logger.info(f"Categoria {instance.pk} ({instance.nome}) deleted - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(categoria_id=instance.pk, action="deleted"))


@receiver(pre_save, sender="blog.ArquivoPost")
def delete_replaced_arquivo_post_file(sender, instance, **kwargs):
    """Delete old file from storage when a blog attachment file is replaced."""
    if not instance.pk:
        return

    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    old_file = old_instance.arquivo
    new_file = instance.arquivo
    if old_file and old_file.name != getattr(new_file, "name", None):
        transaction.on_commit(lambda: default_storage.delete(old_file.name))


@receiver(post_save, sender="blog.ArquivoPost")
def rebuild_frontend_arquivo_post_save(sender, instance, **kwargs):
    """Trigger frontend rebuild when a Post attachment is created or updated."""
    action = "attachment_created" if kwargs.get("created", False) else "attachment_updated"
    logger.info(
        f"ArquivoPost {instance.pk} for Post {instance.post_id} {action} - scheduling frontend rebuild"
    )
    _log_blog_upload_paths(arquivo_post=instance)
    transaction.on_commit(lambda: trigger_frontend_rebuild(post_id=instance.post_id, action=action))


@receiver(post_delete, sender="blog.ArquivoPost")
def cleanup_arquivo_post_delete(sender, instance, **kwargs):
    """Delete attachment file and rebuild frontend when a Post attachment is deleted."""
    file_name = instance.arquivo.name if instance.arquivo else None
    post_id = instance.post_id
    logger.info(
        f"ArquivoPost {instance.pk} for Post {post_id} deleted - scheduling frontend rebuild"
    )

    def on_commit():
        if file_name:
            default_storage.delete(file_name)
        trigger_frontend_rebuild(post_id=post_id, action="attachment_deleted")

    transaction.on_commit(on_commit)
