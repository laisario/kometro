#!/usr/bin/env python
"""
Script para testar o envio de emails de instrumentos expirados para todos os usuários do cliente.

Este script verifica se todos os usuários do cliente recebem email quando há instrumentos expirados.

Execute: python test_instrumentos_email_task.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rkp_platform.settings')
django.setup()

from instrumentos.tasks import (
    enviar_emails_instrumentos_expirados,
    _obter_email_usuario
)
from instrumentos.models import InstrumentoDoCliente, Instrumento
from instrumentos.models import TipoInstrumento
from clientes.models import Cliente
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from datetime import timedelta, date

def test_instrumentos_expirados_real():
    """Testa o envio de emails REAIS para instrumentos expirados"""
    print("=" * 60)
    print("TESTE: Instrumentos Expirados - Envio de Email REAL")
    print("=" * 60)
    print("⚠ ATENÇÃO: Este teste ENVIARÁ emails reais!")
    print()
    
    # Encontra o cliente com laisa.rioverde@gmail.com
    try:
        user_laisa = User.objects.get(username="laisa.rioverde@gmail.com")
        cliente = user_laisa.clientes.first()
        
        if not cliente:
            print("⚠ Cliente não encontrado para laisa.rioverde@gmail.com")
            print("   Execute primeiro a configuração de dados de teste (setup_test_data)")
            return
        
        print(f"Cliente encontrado: {cliente}")
        print(f"ID do cliente: {cliente.id}")
        print()
        
        # Lista todos os usuários do cliente
        usuarios_cliente = cliente.usuarios.all()
        print(f"Total de usuários no cliente: {usuarios_cliente.count()}")
        print("Usuários do cliente que receberão email:")
        usuarios_data = []
        for user in usuarios_cliente:
            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name
            }
            usuarios_data.append(user_data)
            email_obtido = _obter_email_usuario(user_data)
            status = "✓" if email_obtido else "✗ SEM EMAIL VÁLIDO"
            print(f"  - {user.username} (email: {user.email}) -> {email_obtido} {status}")
        print()
        
        # Lista instrumentos expirados do cliente que serão notificados
        hoje = timezone.now().date()
        intervalo_notificacao = timedelta(days=15)
        
        instrumentos_expirados = InstrumentoDoCliente.objects.filter(
            cliente=cliente,
            expirado=True
        )
        
        instrumentos_para_notificar = []
        for inst in instrumentos_expirados:
            if inst.ultima_notificacao is None:
                instrumentos_para_notificar.append(inst)
            elif (timezone.now() - inst.ultima_notificacao) >= intervalo_notificacao:
                instrumentos_para_notificar.append(inst)
        
        print(f"Total de instrumentos expirados: {instrumentos_expirados.count()}")
        print(f"Instrumentos que receberão notificação: {len(instrumentos_para_notificar)}")
        print()
        
        if instrumentos_para_notificar:
            print("Instrumentos que serão notificados:")
            for inst in instrumentos_para_notificar:
                print(f"  - {inst.tag} (ID: {inst.id})")
                print(f"    Expiração: {inst.data_proxima_calibracao}")
                print(f"    Última notificação: {inst.ultima_notificacao}")
            print()
        else:
            print("⚠ Nenhum instrumento será notificado!")
            print("   Isso pode acontecer se:")
            print("   - Não há instrumentos expirados")
            print("   - Todos os instrumentos foram notificados há menos de 15 dias")
            print()
            return
        
        # Emails válidos esperados
        emails_validos_esperados = [
            _obter_email_usuario(u) for u in usuarios_data
            if _obter_email_usuario(u) is not None
        ]
        print(f"Emails que receberão notificação ({len(emails_validos_esperados)}):")
        for email in emails_validos_esperados:
            print(f"  - {email}")
        print()
        
        # Confirmação
        print("=" * 60)
        confirmacao = input("Deseja continuar e enviar os emails? (s/N): ").strip().lower()
        if confirmacao != 's':
            print("✗ Teste cancelado pelo usuário")
            return
        print()
        
        # Executa a task
        try:
            print("Enviando emails...")
            enviar_emails_instrumentos_expirados()
            print()
            print("✓ Task executada com sucesso!")
            print()
            print("=" * 60)
            print("RESULTADO:")
            print("=" * 60)
            print(f"✓ {len(instrumentos_para_notificar)} instrumento(s) processado(s)")
            print(f"✓ Emails enviados para {len(emails_validos_esperados)} destinatário(s)")
            print()
            print("Verifique sua caixa de entrada para confirmar o recebimento!")
            print()
            
            # Mostra o status atualizado dos instrumentos
            print("Status atualizado dos instrumentos:")
            for inst in instrumentos_para_notificar:
                inst.refresh_from_db()
                print(f"  - {inst.tag}: última notificação = {inst.ultima_notificacao}")
            print()
            
        except Exception as e:
            print(f"✗ ERRO ao executar task: {e}")
            import traceback
            traceback.print_exc()
            
    except User.DoesNotExist:
        print("⚠ Usuário laisa.rioverde@gmail.com não encontrado")
        print("   Execute primeiro a configuração de dados de teste (setup_test_data)")
    except Exception as e:
        print(f"✗ ERRO: {e}")
        import traceback
        traceback.print_exc()
    
    print()



def setup_test_data():
    """Configura dados de teste: usuários e instrumentos"""
    print("=" * 60)
    print("CONFIGURAÇÃO DE DADOS DE TESTE")
    print("=" * 60)
    
    email1 = "laisa.rioverde@gmail.com"
    email2 = "laisa.solucoes.tecnicas@gmail.com"
    
    # Encontra ou cria o primeiro usuário
    try:
        user1 = User.objects.get(username=email1)
        print(f"✓ Usuário encontrado: {user1.username}")
    except User.DoesNotExist:
        user1 = User.objects.create_user(
            username=email1,
            email=email1,
            first_name="Laisa Rioverde"
        )
        print(f"✓ Usuário criado: {user1.username}")
    
    # Encontra o cliente associado ao primeiro usuário
    cliente = user1.clientes.first()
    if not cliente:
        print("⚠ ERRO: O usuário laisa.rioverde@gmail.com não está associado a nenhum cliente!")
        print("   Por favor, associe o usuário a um cliente primeiro.")
        return None
    
    print(f"✓ Cliente encontrado: {cliente} (ID: {cliente.id})")
    
    # Cria ou encontra o segundo usuário
    try:
        user2 = User.objects.get(username=email2)
        print(f"✓ Usuário encontrado: {user2.username}")
    except User.DoesNotExist:
        user2 = User.objects.create_user(
            username=email2,
            email=email2,
            first_name="Laisa Soluções Técnicas"
        )
        print(f"✓ Usuário criado: {user2.username}")
    
    # Associa o segundo usuário ao mesmo cliente
    if cliente not in user2.clientes.all():
        cliente.usuarios.add(user2)
        print(f"✓ Usuário {user2.username} associado ao cliente {cliente}")
    else:
        print(f"✓ Usuário {user2.username} já estava associado ao cliente")
    
    # Cria tipo de instrumento se não existir
    tipo_instrumento, _ = TipoInstrumento.objects.get_or_create(
        descricao="Termômetro Digital",
        modelo="TD-100",
        fabricante="Teste Fabricante",
        defaults={"resolucao": 4}
    )
    print(f"✓ Tipo de instrumento: {tipo_instrumento.descricao}")
    
    # Cria instrumento base se não existir
    instrumento, _ = Instrumento.objects.get_or_create(
        tipo_de_instrumento=tipo_instrumento,
        defaults={
            "minimo": 0,
            "maximo": 100,
            "unidade": "°C"
        }
    )
    print(f"✓ Instrumento criado/encontrado (ID: {instrumento.id})")
    
    # Cria instrumento que expirará em 30 dias
    hoje = timezone.now().date()
    data_expira_30_dias = hoje + timedelta(days=30)
    
    instrumento_30dias, created = InstrumentoDoCliente.objects.get_or_create(
        cliente=cliente,
        instrumento=instrumento,
        tag="TEST-30D",
        defaults={
            "data_proxima_calibracao": data_expira_30_dias,
            "data_ultima_calibracao": hoje - timedelta(days=335),
            "posicao": InstrumentoDoCliente.Posicao.EM_USO,
            "expirado": False
        }
    )
    if created:
        print(f"✓ Instrumento criado para expirar em 30 dias: {instrumento_30dias.tag}")
    else:
        instrumento_30dias.data_proxima_calibracao = data_expira_30_dias
        instrumento_30dias.expirado = False
        instrumento_30dias.save()
        print(f"✓ Instrumento atualizado para expirar em 30 dias: {instrumento_30dias.tag}")
    
    # Cria dois instrumentos vencidos para testar
    data_vencida = hoje - timedelta(days=10)
    
    # Primeiro instrumento vencido
    instrumento_vencido1, created = InstrumentoDoCliente.objects.get_or_create(
        cliente=cliente,
        instrumento=instrumento,
        tag="TEST-EXP-1",
        defaults={
            "data_proxima_calibracao": data_vencida,
            "data_ultima_calibracao": hoje - timedelta(days=380),
            "posicao": InstrumentoDoCliente.Posicao.EM_USO,
            "expirado": True,
            "ultima_notificacao": None  # Para garantir que será notificado
        }
    )
    if created:
        print(f"✓ Instrumento vencido 1 criado: {instrumento_vencido1.tag}")
    else:
        instrumento_vencido1.data_proxima_calibracao = data_vencida
        instrumento_vencido1.expirado = True
        instrumento_vencido1.ultima_notificacao = None
        instrumento_vencido1.save()
        print(f"✓ Instrumento atualizado como vencido: {instrumento_vencido1.tag}")
    
    # Segundo instrumento vencido
    instrumento_vencido2, created = InstrumentoDoCliente.objects.get_or_create(
        cliente=cliente,
        instrumento=instrumento,
        tag="TEST-EXP-2",
        defaults={
            "data_proxima_calibracao": hoje - timedelta(days=5),
            "data_ultima_calibracao": hoje - timedelta(days=365),
            "posicao": InstrumentoDoCliente.Posicao.EM_USO,
            "expirado": True,
            "ultima_notificacao": None  # Para garantir que será notificado
        }
    )
    if created:
        print(f"✓ Instrumento vencido 2 criado: {instrumento_vencido2.tag}")
    else:
        instrumento_vencido2.data_proxima_calibracao = hoje - timedelta(days=5)
        instrumento_vencido2.expirado = True
        instrumento_vencido2.ultima_notificacao = None
        instrumento_vencido2.save()
        print(f"✓ Instrumento atualizado como vencido: {instrumento_vencido2.tag}")
    
    print()
    print("=" * 60)
    print("DADOS DE TESTE CONFIGURADOS COM SUCESSO!")
    print("=" * 60)
    print(f"Cliente: {cliente}")
    print(f"Usuários associados: {cliente.usuarios.count()}")
    for user in cliente.usuarios.all():
        print(f"  - {user.username} ({user.email})")
    print(f"Instrumentos de teste:")
    print(f"  - {instrumento_30dias.tag} (expira em 30 dias)")
    print(f"  - {instrumento_vencido1.tag} (vencido)")
    print(f"  - {instrumento_vencido2.tag} (vencido)")
    print()
    
    return cliente


def main():
    print("\n" + "=" * 60)
    print("TESTE DE ENVIO DE EMAILS - INSTRUMENTOS EXPIRADOS")
    print("=" * 60 + "\n")
    
    # Pergunta se quer configurar dados de teste
    setup_response = input("Deseja configurar dados de teste (usuários e instrumentos)? (S/n): ").strip().lower()
    if setup_response != 'n':
        cliente = setup_test_data()
        if not cliente:
            return
        print()
    
    # Executa o teste de instrumentos expirados
    test_instrumentos_expirados_real()
    
    print("\n" + "=" * 60)
    print("TESTE CONCLUÍDO")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
