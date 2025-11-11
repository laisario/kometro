from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from rkp_platform.utils import trigger_frontend_rebuild


@receiver(post_save, sender="blog.Post")
def rebuild_frontend_post(sender, instance, **kwargs):
    trigger_frontend_rebuild()

@receiver(post_save, sender="blog.Categoria")
@receiver(post_delete, sender="blog.Categoria")
def rebuild_frontend_categoria(sender, instance, **kwargs):
    trigger_frontend_rebuild()

