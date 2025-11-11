from django.core.management.base import BaseCommand
from instrumentos.models import Instrumento, InstrumentoBaseCliente, InstrumentoDoCliente
from clientes.models import Cliente


class Command(BaseCommand):
    help = 'Populate InstrumentoBaseCliente table with existing instrument relationships'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate InstrumentoBaseCliente table...')
        
        # Get all unique clients that have instruments
        clientes_com_instrumentos = Cliente.objects.filter(
            instrumentos__isnull=False
        ).distinct()
        
        created_count = 0
        
        for cliente in clientes_com_instrumentos:
            # Get all instruments used by this client
            instrumentos_do_cliente = InstrumentoDoCliente.objects.filter(
                cliente=cliente
            ).values_list('instrumento', flat=True).distinct()
            
            for instrumento_id in instrumentos_do_cliente:
                instrumento = Instrumento.objects.get(id=instrumento_id)
                
                # Create InstrumentoBaseCliente relationship if it doesn't exist
                instrumento_base_cliente, created = InstrumentoBaseCliente.objects.get_or_create(
                    instrumento=instrumento,
                    cliente=cliente,
                    defaults={'ativo': True}
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        f'Created relationship:  - {instrumento.tipo_de_instrumento.descricao}'
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} InstrumentoBaseCliente relationships'
            )
        )
