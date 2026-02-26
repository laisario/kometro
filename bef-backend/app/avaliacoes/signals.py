from django.db.models.signals import post_save
from django.db import transaction
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender="avaliacoes.Avaliacao")
def rebuild_frontend_avaliacao(sender, instance, **kwargs):
    action = "created" if kwargs.get("created", False) else "updated"
    logger.info(f"Avaliacao {instance.pk} {action} - scheduling frontend rebuild")
    transaction.on_commit(lambda: trigger_frontend_rebuild(action=action))

