from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Cliente
from instrumentos.models import Normativo

NORMAS_PADRAO = [
    "ISO 9001",
    "IATF 16949",
    "ISO 14001",
    "ISO 45001",
    "ABNT ISO IEC 17025",
]

@receiver(post_save, sender=Cliente)
def criar_normas_padrao(sender, instance, created, **kwargs):
    if created:
        for nome in NORMAS_PADRAO:
          Normativo.objects.create(nome=nome, cliente=instance)
