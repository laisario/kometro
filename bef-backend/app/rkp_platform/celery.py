import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rkp_platform.settings")

app = Celery("rkp_platform")

app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "enviar-emails-documentos-expirados": {
        "task": "documentos.tasks.enviar_emails_documentos_expirados",
        "schedule": crontab(minute=0, hour=9),
    },
    "notificar-aprovacao-revisoes": {
        "task": "documentos.tasks.notificar_aprovacao_revisoes",
        "schedule": crontab(minute=0, hour=9),
    },
    "expires_documents": {
        "task": "documentos.tasks.expires_documents",
        "schedule": crontab(minute=0, hour=1),
    },
    "expires_instruments": {
        "task": "instrumentos.tasks.expires_instruments",
        "schedule": crontab(minute=0, hour=4),
    },
    "enviar-emails-instrumentos-expirados": {
        "task": "instrumentos.tasks.enviar_emails_instrumentos_expirados",
        "schedule": crontab(minute=0, hour=9),
    },
    "enviar_emails_aviso_expiracao_instrumentos": {
        "task": "instrumentos.tasks.enviar_emails_aviso_expiracao_instrumentos",
        "schedule": crontab(minute=0, hour=9),
    },
    "update_clients": {
        "task": "clientes.tasks.update_clients",
        "schedule": crontab(minute=0, hour=6),
    },
  
}
