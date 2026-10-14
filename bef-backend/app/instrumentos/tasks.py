import io
import tempfile
from datetime import date, timedelta

from celery import shared_task
from django.core.files import File
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.templatetags.static import static
from django.conf import settings
import logging

from .admin import InstrumentoExportResource
from .constants import (
    INSTRUMENT_EXPORT_ERROR_MESSAGE,
    INSTRUMENT_EXPORT_NOT_STARTED_MESSAGE,
    INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MESSAGE,
    INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MINUTES,
    INSTRUMENT_EXPORT_QUEUE_TIMEOUT_MINUTES,
)
from .models import InstrumentExportJob, InstrumentoDoCliente
from .serializers import InstrumentoDoClienteReadSerializer
from .services import (
    expire_instrument_export_job,
    get_authorized_instrument_export_queryset,
    get_instrument_export_storage,
    user_can_access_instrument_export_job,
)
from dateutil.relativedelta import relativedelta


logger = logging.getLogger(__name__)

PERIODOS_RELATIVEDELTA = {
    "dia": "days",
    "dias": "days",
    "mes": "months",
    "meses": "months",
    "ano": "years",
    "anos": "years",
}


def enviar_email(data):
    html_content = render_to_string(
        template_name=data["template"], context=data["variables"]
    )

    try:
        send_mail(
            subject=data["assunto"],
            message=data["message"],
            html_message=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=data["to_email"],
            fail_silently=False,
        )
        print("Enviado com sucesso!")
    except Exception as e:
        print("Aconteu o erro de email:", e)
        import traceback

        logger.error("Erro ao enviar email: %s", str(e))
        logger.debug("Traceback:\n%s", traceback.format_exc())


@shared_task
def enviar_emails_aviso_expiracao_instrumentos():
    data_aviso = timezone.now().date() + timedelta(days=30)
    instrumentos_expirarao = InstrumentoDoCliente.objects.filter(
        data_proxima_calibracao=data_aviso
    )

    for instrumento in instrumentos_expirarao:
        instancia_instrumento = InstrumentoDoClienteReadSerializer(instrumento).data
        logo = static("logo.png")
        
        emails_usuarios = [user["username"] for user in instancia_instrumento["cliente"]["usuarios"]]
        nome_instrumento = f"{instancia_instrumento['instrumento']['tipo_de_instrumento']['descricao']} - {instancia_instrumento['tag']}"

        enviar_email(
            {
                "assunto": f"Aviso de Expiração de Calibração em 30 dias – {instancia_instrumento['instrumento']['tipo_de_instrumento']['descricao']}",
                "email": "comercial@envios.rkp.com.br",
                "to_email": emails_usuarios,
                "variables": {
                    "nome_instrumento": nome_instrumento,
                    "logo": logo
                },
                "template": "aviso_instrumentos_expirarao.html",
                "message": "Evite que seu instrumento fique com a calibração vencida — agende com antecedência!",
                "link": "https://app.kometro.com.br/#/dashboard/propostas",
            }
        )
        instrumento.ultima_notificacao = timezone.now()
        instrumento.save()


@shared_task
def enviar_emails_instrumentos_expirados():
    intervalo_notificacao = timezone.timedelta(days=15)

    instrumentos_expirados = InstrumentoDoCliente.objects.filter(expirado=True)

    for instrumento in instrumentos_expirados:
        if (
            instrumento.ultima_notificacao is not None
            and timezone.now() - instrumento.ultima_notificacao >= intervalo_notificacao
        ) or instrumento.ultima_notificacao is None:
            instancia_instrumento = InstrumentoDoClienteReadSerializer(instrumento).data
            logo = static("logo.png")
            
            emails_usuarios = [user["username"] for user in instancia_instrumento["cliente"]["usuarios"]]
            nome_instrumento = f"{instancia_instrumento['instrumento']['tipo_de_instrumento']['descricao']} - {instancia_instrumento['tag']}"
            enviar_email(
                {
                    "assunto": f"Aviso de Expiração de Calibração – {instancia_instrumento['instrumento']['tipo_de_instrumento']['descricao']}",
                    "email": "comercial@envios.rkp.com.br",
                    "to_email": emails_usuarios,
                    "variables": {
                        "instrumento_id": instancia_instrumento["id"],
                        "data_validade": instancia_instrumento[
                            "data_proxima_calibracao"
                        ],
                        "nome_instrumento": nome_instrumento,
                        "logo": logo,
                        "expiracao": f"expirou dia {instancia_instrumento['data_proxima_calibracao']} e ainda não foi atualizado"
                        if instrumento.ultima_notificacao
                        else "expira hoje",
                        "link": "https://app.kometro.com.br/#/dashboard/propostas",
                    },
                    "template": "instrumentos_expirados.html",
                    "message": "Sua calibração está vencida – regularize com facilidade pela nossa plataforma!",
                }
            )
            instrumento.ultima_notificacao = timezone.now()
            instrumento.save()

    return f"{instrumentos_expirados.count()} instrumentos expirados processados."

@shared_task
def expires_instruments():
    today = date.today()
    for instrumento in InstrumentoDoCliente.objects.all():
        if instrumento.data_proxima_calibracao:
            instrumento.expirado = instrumento.data_proxima_calibracao < today
        instrumento.save()


@shared_task(name="instrumentos.tasks.generate_instrument_export")
def generate_instrument_export(job_id):
    now = timezone.now()
    claimed = InstrumentExportJob.objects.filter(
        id=job_id,
        status=InstrumentExportJob.Status.QUEUED,
        expires_at__gt=now,
    ).update(
        status=InstrumentExportJob.Status.PROCESSING,
        started_at=now,
        error_message="",
    )
    if not claimed:
        return {"status": "ignored", "job_id": str(job_id)}

    job = InstrumentExportJob.objects.select_related(
        "requested_by"
    ).get(id=job_id)
    saved_file_name = ""

    try:
        if not job.requested_by.is_active:
            raise PermissionError("Export owner is inactive.")
        if not user_can_access_instrument_export_job(job.requested_by, job):
            raise PermissionError("Export owner no longer has access to clients.")

        frozen_ids = [int(item_id) for item_id in job.instrument_ids]
        queryset = get_authorized_instrument_export_queryset(job.requested_by)
        if job.client_ids:
            queryset = queryset.filter(cliente_id__in=job.client_ids)
        instrumentos = list(
            queryset.filter(id__in=frozen_ids).order_by("-id")
        )

        if {item.id for item in instrumentos} != set(frozen_ids):
            raise PermissionError("Frozen export set is no longer authorized or available.")

        resource = InstrumentoExportResource(
            campos_selecionados=job.selected_fields
        )
        dataset = resource.export(queryset=instrumentos)
        csv_content = dataset.csv

        job.refresh_from_db(fields=("status", "expires_at"))
        if (
            job.status == InstrumentExportJob.Status.EXPIRED
            or job.expires_at <= timezone.now()
        ):
            expire_instrument_export_job(job)
            return {"status": "expired", "job_id": str(job.id)}

        storage = get_instrument_export_storage()
        with tempfile.TemporaryFile(mode="w+b") as temporary_csv:
            text_csv = io.TextIOWrapper(
                temporary_csv,
                encoding="utf-8",
                newline="",
            )
            text_csv.write(csv_content)
            text_csv.flush()
            text_csv.detach()
            del csv_content, dataset, resource
            temporary_csv.seek(0)
            saved_file_name = storage.save(
                f"{job.id}/instrumentos_exportados.csv",
                File(temporary_csv),
            )
        finished_at = timezone.now()
        completed = InstrumentExportJob.objects.filter(
            id=job.id,
            status=InstrumentExportJob.Status.PROCESSING,
            expires_at__gt=finished_at,
        ).update(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name=saved_file_name,
            finished_at=finished_at,
            error_message="",
        )
        if not completed:
            if storage.exists(saved_file_name):
                storage.delete(saved_file_name)
            return {"status": "expired", "job_id": str(job.id)}

        return {
            "status": "completed",
            "job_id": str(job.id),
            "exported_count": job.exported_count,
        }
    except Exception:
        logger.exception("Instrument export job %s failed", job_id)
        if saved_file_name:
            try:
                storage = get_instrument_export_storage()
                if storage.exists(saved_file_name):
                    storage.delete(saved_file_name)
            except Exception:
                logger.exception(
                    "Failed to remove partial file for export job %s", job_id
                )
        InstrumentExportJob.objects.filter(id=job_id).exclude(
            status=InstrumentExportJob.Status.EXPIRED
        ).update(
            status=InstrumentExportJob.Status.FAILED,
            error_message=INSTRUMENT_EXPORT_ERROR_MESSAGE,
            finished_at=timezone.now(),
        )
        return {"status": "failed", "job_id": str(job_id)}


@shared_task(name="instrumentos.tasks.cleanup_expired_instrument_exports")
def cleanup_expired_instrument_exports():
    now = timezone.now()
    jobs = InstrumentExportJob.objects.filter(
        expires_at__lte=now
    ).exclude(
        status=InstrumentExportJob.Status.EXPIRED,
        file_name="",
    )
    cleaned = 0
    for job in jobs.iterator():
        expire_instrument_export_job(job)
        cleaned += 1

    queued_failed = InstrumentExportJob.objects.filter(
        status=InstrumentExportJob.Status.QUEUED,
        started_at__isnull=True,
        created_at__lte=now - timedelta(
            minutes=INSTRUMENT_EXPORT_QUEUE_TIMEOUT_MINUTES
        ),
        expires_at__gt=now,
    ).update(
        status=InstrumentExportJob.Status.FAILED,
        error_message=INSTRUMENT_EXPORT_NOT_STARTED_MESSAGE,
        finished_at=now,
    )
    processing_failed = InstrumentExportJob.objects.filter(
        status=InstrumentExportJob.Status.PROCESSING,
        started_at__lte=now - timedelta(
            minutes=INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MINUTES
        ),
        expires_at__gt=now,
    ).update(
        status=InstrumentExportJob.Status.FAILED,
        error_message=INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MESSAGE,
        finished_at=now,
    )

    return {
        "expired_jobs": cleaned,
        "queued_jobs_failed": queued_failed,
        "processing_jobs_failed": processing_failed,
    }


