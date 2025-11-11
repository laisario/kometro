from datetime import date
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import Documento, Revisao
from .serializers import ReadDocumentoSerializer, ReadRevisaoSerializer
from django.utils import timezone
from django.templatetags.static import static
from django.conf import settings
import logging
from django.db.models import Count, F
from clientes.serializers import UserSerializer


logger = logging.getLogger(__name__)



@shared_task
def expires_documents():
    today = date.today()
    for documento in Documento.objects.all():
        documento.vencido = documento.data_validade < today
        documento.save()


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
            recipient_list=[data["to_email"]],
            fail_silently=False,
        )
        print("Enviado com sucesso!")
    except Exception as e:
        print("Aconteu o erro de email:", e)
        import traceback

        logger.error("Erro ao enviar email: %s", str(e))
        logger.debug("Traceback:\n%s", traceback.format_exc())


@shared_task
def enviar_emails_documentos_expirados():
    intervalo_notificacao = timezone.timedelta(days=2)

    documentos_expirados = Documento.objects.filter(vencido=True)

    for documento in documentos_expirados:
        if (
            documento.ultima_notificacao is not None
            and timezone.now() - documento.ultima_notificacao >= intervalo_notificacao
        ) or documento.ultima_notificacao is None:
            doc = ReadDocumentoSerializer(documento).data
            logo = static("logo.png")
            enviar_email(
                {
                    "assunto": f"Documento {doc['titulo']} expirado",
                    "email": "comercial@envios.rkp.com.br",
                    "to_email": doc["criador"]["username"],
                    "variables": {
                        "documento_id": doc["id"],
                        "funcionario": doc["criador"]["first_name"],
                        "data_validade": doc["data_validade"],
                        "nome_documento": doc["titulo"],
                        "logo": logo,
                        "expiracao": f"expirou dia {doc['data_validade']} e ainda não foi atualizado"
                        if documento.ultima_notificacao
                        else "expira hoje",
                    },
                    "template": "documentos_expirados.html",
                    "message": "Este é um lembrete: o documento sob sua responsabilidade expirou e precisa de revisão ou revalidação.",
                    "link": f"https://app.kometro.com.br/#/admin/documento/{doc['id']}/0",
                }
            )
            documento.ultima_notificacao = timezone.now()
            documento.save()

    return f"{documentos_expirados.count()} documentos expirados processados."


@shared_task
def notificar_aprovacao_revisoes():
    intervalo_notificacao = timezone.timedelta(days=2)

    revisoes_sem_aprovacao = Revisao.objects.annotate(
        num_aprovadores=Count("aprovadores", distinct=True),
        num_aprovacoes=Count("aprovacoes", distinct=True),
    ).filter(num_aprovacoes__lt=F("num_aprovadores"))

    for revisao in revisoes_sem_aprovacao:
        usuarios_que_nao_aprovaram = revisao.aprovadores.exclude(
            id__in=revisao.aprovacoes.values_list("id", flat=True)
        )
        if (
            revisao.ultima_notificacao is not None
            and timezone.now() - revisao.ultima_notificacao >= intervalo_notificacao
        ) or revisao.ultima_notificacao is None:
            rev = ReadRevisaoSerializer(revisao).data
            for user in usuarios_que_nao_aprovaram:
                aprovador = UserSerializer(user).data
                enviar_email(
                    {
                        "assunto": f"Aviso: {'Revisão' if rev['tipo'] == 'revisar' else 'Revalidação'} pendente para sua aprovação",
                        "email": "comercial@envios.rkp.com.br",
                        "to_email": aprovador["username"],
                        "variables": {
                            "documento_id": rev["documento"]["id"],
                            "revisao_id": rev["id"],
                            "funcionario": aprovador["first_name"],
                            "nome_documento": rev["documento"]["titulo"],
                            "tipo_notificacao": "está disponível para",
                            "tipo_analise": "revisão"
                            if rev["tipo"] == "revisar"
                            else "revalidação",
                        },
                        "template": "aprovacoes_pendentes.html",
                        "message": f"Este é um lembrete: há  uma {'revisão' if rev['tipo'] == 'revisar' else 'revalidação'} que precisa ser aprovada.",
                        "link": f"https://app.kometro.com.br/#/admin/documento/{rev['documento']['id']}/{rev['id']}",
                    }
                )
        revisao.ultima_notificacao = timezone.now()
        revisao.save()

    return f"{revisoes_sem_aprovacao.count()} revisoes processadas."


@shared_task
def expires_documents():
    today = date.today()
    for documento in Documento.objects.all():
        documento.vencido = documento.data_validade <= today
        documento.save()
