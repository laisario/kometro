#!/usr/bin/env python
"""
Script para testar o envio de email de reset de senha
Execute: python test_email_task.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rkp_platform.settings')
django.setup()

from clientes.tasks import enviar_email_reset_senha

# Teste síncrono (executa direto, sem Celery)
print("=== TESTE 1: Execução síncrona (sem Celery) ===")
result = enviar_email_reset_senha("laisa.rioverde@gmail.com", "Laisa", "https://app.kometro.com.br/#/reset-password/test-token-123")
print(f"Resultado: {result}\n")

# Teste assíncrono (com Celery - requer worker rodando)
print("=== TESTE 2: Execução assíncrona (com Celery) ===")
try:
    task = enviar_email_reset_senha.delay("laisa.rioverde@gmail.com", "Laisa", "https://app.kometro.com.br/#/reset-password/test-token-456")
    print(f"Task enviada! ID: {task.id}")
    print(f"Status: {task.status}")
    print("Verifique os logs do Celery worker para ver a execução")
except Exception as e:
    print(f"Erro ao enviar task: {e}")
    print("NOTA: Certifique-se de que o Celery worker está rodando!")

