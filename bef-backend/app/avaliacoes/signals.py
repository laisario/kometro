from django.db.models.signals import post_save
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild

@receiver(post_save, sender="avaliacoes.Avaliacao")
def rebuild_frontend_avaliacao(sender, instance, **kwargs):
    trigger_frontend_rebuild()


