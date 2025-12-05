from .models import Cliente
from celery import shared_task
from datetime import date
from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def update_clients(cliente_id=None):
    if cliente_id:
        clientes = Cliente.objects.filter(id=cliente_id)
    else:
        clientes = Cliente.objects.all()
    
    for cliente in clientes:
        today = date.today()
        
        for instrumento in cliente.instrumentos.all():
            if instrumento.data_proxima_calibracao:
                instrumento.expirado = instrumento.data_proxima_calibracao < today
            instrumento.save()
        
        cliente.instrumentos_vencidos = cliente.instrumentos.filter(
            expirado=True
        ).count()
        cliente.instrumentos_em_dia = cliente.instrumentos.filter(
            expirado=False
        ).count()
        cliente.instrumentos_cadastrados = cliente.instrumentos.count()
        cliente.propostas_aguardando_aprovacao = cliente.propostas.filter(
            status="AA"
        ).count()
        cliente.save()
    
    if cliente_id:
        return f"Statistics and expiration status updated for client {cliente_id}"
    else:
        return f"Statistics and expiration status updated for all clients"


@shared_task
def update_client_stats_with_expiration(cliente_id):
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        today = date.today()
        
        for instrumento in cliente.instrumentos.all():
            if instrumento.data_proxima_calibracao:
                instrumento.expirado = instrumento.data_proxima_calibracao < today
            instrumento.save()
        
        cliente.instrumentos_vencidos = cliente.instrumentos.filter(
            expirado=True
        ).count()
        cliente.instrumentos_em_dia = cliente.instrumentos.filter(
            expirado=False
        ).count()
        cliente.instrumentos_cadastrados = cliente.instrumentos.count()
        cliente.propostas_aguardando_aprovacao = cliente.propostas.filter(
            status="AA"
        ).count()
        cliente.save()
        
        return f"Statistics and expiration status updated for client {cliente.nome}"
    except Cliente.DoesNotExist:
        return f"Client with id {cliente_id} not found"
    except Exception as e:
        return f"Error updating client statistics: {str(e)}"

@shared_task
def update_dashboard_stats(cliente_id):
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        today = date.today()
        
        for instrumento in cliente.instrumentos.all():
            if instrumento.data_proxima_calibracao:
                instrumento.expirado = instrumento.data_proxima_calibracao < today
            instrumento.save()
        
        cliente.instrumentos_vencidos = cliente.instrumentos.filter(
            expirado=True
        ).count()
        cliente.instrumentos_em_dia = cliente.instrumentos.filter(
            expirado=False
        ).count()
        cliente.instrumentos_cadastrados = cliente.instrumentos.count()
        cliente.propostas_aguardando_aprovacao = cliente.propostas.filter(
            status="AA"
        ).count()
        cliente.save()
        
        return f"Statistics and expiration status updated for client {cliente}"
    except Cliente.DoesNotExist:
        return f"Client with id {cliente_id} not found"
    except Exception as e:
        return f"Error updating client statistics: {str(e)}"


@shared_task
def enviar_email_reset_senha(email, nome, reset_url):
    """
    Send password reset email to user
    """
    
    try:
        html_content = render_to_string(
            template_name="reset_password.html",
            context={
                "nome": nome,
                "reset_url": reset_url,
            }
        )
        email_msg = EmailMessage(
            subject="Redefinição de Senha - Kometro",
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        email_msg.content_subtype = "html"
        result = email_msg.send(fail_silently=False)
        logger.info("Email enviado" if result == 1 else "Falha ao enviar email")
        return f"Email enviado para {email}"
    except Exception as e:
        logger.error(f"✗ Erro ao enviar email de reset de senha para {email}: {str(e)}")
        import traceback
        traceback.print_exc()
        return f"Erro ao enviar email: {str(e)}"

