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
                result = email.send(fail_silently=False)
                print("Email enviado" if result == 1 else "Falha ao enviar email")
            except Exception as e:
                print("Aconteu o erro de email:", e)

            finally:
                file.close()


@shared_task
def gerar_pdf_proposta(proposta_id, revisao_id, total_com_desconto):
    """
    Task assíncrona para gerar o PDF da proposta.
    """
    try:
        proposta = Proposta.objects.get(id=proposta_id)
        rev = Revisao.objects.get(id=revisao_id)
        
        instrumentos = proposta.instrumentos.all()
        logo = static("logo.png")
        selo = static("selo-acreditado-inmetro.jpg")

        pdf = render_to_pdf(
            f"{os.path.dirname(__file__)}/templates/proposta.html",
            {
                "instrumentos": instrumentos,
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
