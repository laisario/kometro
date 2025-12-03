from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild

@receiver(post_save, sender="equipamentos.Categoria")
@receiver(post_delete, sender="equipamentos.Categoria")
def rebuild_frontend_categoria_equipamento(sender, instance, **kwargs):
    trigger_frontend_rebuild()

@receiver(post_save, sender="equipamentos.Equipamento")
def rebuild_frontend_equipamento(sender, instance, **kwargs):
    trigger_frontend_rebuild()
