from django.db.models.signals import post_save, post_delete
from django.db import transaction
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender="equipamentos.Categoria")
def rebuild_frontend_categoria_equipamento_save(sender, instance, **kwargs):
    action = "created" if kwargs.get("created", False) else "updated"
    logger.info(f"Equipamento Categoria {instance.pk} ({instance.nome}) {action} - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(categoria_id=instance.pk, action=action))


@receiver(post_delete, sender="equipamentos.Categoria")
def rebuild_frontend_categoria_equipamento_delete(sender, instance, **kwargs):
    logger.info(f"Equipamento Categoria {instance.pk} ({instance.nome}) deleted - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(categoria_id=instance.pk, action="deleted"))


@receiver(post_save, sender="equipamentos.Equipamento")
def rebuild_frontend_equipamento(sender, instance, **kwargs):
    action = "created" if kwargs.get("created", False) else "updated"
    logger.info(f"Equipamento {instance.pk} ({instance.nome}) {action} - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(action=action))
