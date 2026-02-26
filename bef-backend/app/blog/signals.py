from django.db.models.signals import post_save, post_delete
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

