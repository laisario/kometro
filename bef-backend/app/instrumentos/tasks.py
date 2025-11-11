from datetime import date
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import InstrumentoDoCliente
from django.utils import timezone
from django.templatetags.static import static
from django.conf import settings
import logging
from datetime import date, timedelta
from .models import InstrumentoDoCliente
from .serializers import InstrumentoDoClienteReadSerializer
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
                    },
                    "template": "instrumentos_expirados.html",
                    "message": "Sua calibração está vencida – regularize com facilidade pela nossa plataforma!",
                    "link": "https://app.kometro.com.br/#/dashboard/propostas",
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


