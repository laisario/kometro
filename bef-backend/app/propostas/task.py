from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from celery import shared_task
from .models import Proposta


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
