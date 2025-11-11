from .models import Cliente


def update_clients():
    for cliente in Cliente.objects.all():
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

