from django.core.files.storage import default_storage
from django.db.models.signals import post_save, post_delete, pre_save
from django.db import transaction
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender="blog.Post")
def rebuild_frontend_post(sender, instance, **kwargs):
    """Trigger frontend rebuild when a Post is created or updated."""
    action = "created" if kwargs.get("created", False) else "updated"
    logger.info(f"Post {instance.pk} ({instance.titulo}) {action} - scheduling frontend rebuild")
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
