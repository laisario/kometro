from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from celery import shared_task
from .models import Proposta, Revisao
from .pdf import render_to_pdf
from django.templatetags.static import static
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from datetime import date
import os
import logging

logger = logging.getLogger(__name__)


@shared_task
def enviar_proposta_cliente_email(proposta_id, emails):
    logger.info("=" * 50)
    logger.info("DEBUG EMAIL PROPOSTA - INÍCIO")
    logger.info(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    logger.info(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    logger.info(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    logger.info(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    logger.info(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    logger.info(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    logger.info(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    logger.info(f"Destinatários: {emails}")
    logger.info("=" * 50)
    
    proposta = Proposta.objects.get(id=proposta_id)

    html_content = render_to_string(
        template_name="proposta_elaborada.html",
        context={
            "link_aprovacao": f"https://app.kometro.com.br/#/dashboard/proposta/{proposta_id}",
        },
    )
    assunto = f"Sua proposta foi elaborada"
    email = EmailMessage(
        subject=assunto,
        body=html_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=emails,
    )
    email.content_subtype = "html"

    ultima_revisao = proposta.revisoes.last()
    if ultima_revisao:
        with ultima_revisao.pdf.open() as file:
            email.attach(f"proposta{proposta_id}.pdf", file.read(), "application/pdf")
            try:
                logger.info(f"Tentando enviar email: from={email.from_email}, to={email.to}")
                result = email.send(fail_silently=False)
                logger.info(f"Resultado do send(): {result}")
                
                if result == 1:
                    logger.info(f"✓ Email de proposta enviado com sucesso para {emails}")
                else:
                    logger.error(f"✗ Falha ao enviar email de proposta - result={result}")
            except Exception as e:
                logger.error(f"✗ Exceção ao enviar email de proposta: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
            finally:
                file.close()
    else:
        logger.error(f"✗ Proposta {proposta_id} não tem revisão com PDF")


@shared_task
def gerar_pdf_proposta(proposta_id, revisao_id, total_com_desconto, aplicar_selo: bool):
    """
    Task assíncrona para gerar o PDF da proposta.
    """
    try:
        proposta = Proposta.objects.get(id=proposta_id)
        rev = Revisao.objects.get(id=revisao_id)
        
        instrumentos_selecoes = list(
            proposta.instrumentos_selecoes.select_related(
                "instrumento", "instrumento__instrumento", "instrumento__instrumento__tipo_de_instrumento"
            ).all()
        )
        logo = static("logo.png")
        selo = static("selo-acreditado-inmetro.jpg") if aplicar_selo else None

        pdf = render_to_pdf(
            f"{os.path.dirname(__file__)}/templates/proposta.html",
            {
                "instrumentos_selecoes": instrumentos_selecoes,
                "proposta": proposta,
                "data": date.today().strftime("%d/%m/%Y"),
                "condicao_pagamento": proposta.condicao_de_pagamento,
                "logo": logo.split("?")[0],
                "selo": selo,
                "rev": rev.rev,
                "total": total_com_desconto,
            },
        )
        
        if not pdf:
            raise ValidationError(f"Falha ao gerar o PDF para a proposta {proposta.id}")

        file_name = f"proposta{proposta.id}.pdf"
        content_file = ContentFile(pdf, name=file_name)
        rev.pdf = content_file
        rev.save()
        
        logger.info(f"PDF gerado com sucesso para a proposta {proposta.id}")
        return f"PDF gerado com sucesso para a proposta {proposta.id}"
        
    except Exception as e:
        logger.error(f"Erro ao gerar PDF da proposta {proposta_id}: {str(e)}")
        raise
