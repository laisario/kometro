from decimal import Decimal
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import InstrumentoDoCliente, Calibracao
from datetime import date


@receiver(pre_save, sender=InstrumentoDoCliente)
def instrumentos_capture_original_cliente(sender, instance, **kwargs):
    if instance.pk:
        instance._old_cliente_id = (
            sender.objects.filter(pk=instance.pk).values_list("cliente_id", flat=True).first()
        )
    else:
        instance._old_cliente_id = None


@receiver(post_save, sender=InstrumentoDoCliente)
def instrumentos_invalidate_cache_on_save(sender, instance, created, **kwargs):
    cache.delete(f"hierarquia:{instance.cliente_id}")

    old_id = getattr(instance, "_old_cliente_id", None)
    if old_id and old_id != instance.cliente_id:
        cache.delete(f"hierarquia:{old_id}")


@receiver(post_delete, sender=InstrumentoDoCliente)
def instrumentos_invalidate_cache_on_delete(sender, instance, **kwargs):
    cache.delete(f"hierarquia:{instance.cliente_id}")


