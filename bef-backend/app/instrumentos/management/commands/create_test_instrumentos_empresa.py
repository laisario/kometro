from django.core.management.base import BaseCommand
from instrumentos.models import Instrumento, TipoInstrumento, CapacidadeMedicao, TipoServico, TipoSinal, InstrumentoBaseCliente
from procedimentos.models import Procedimento
from clientes.models import Cliente
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create 20 test instrumentos-empresa records for testing search functionality'

    def handle(self, *args, **options):
        self.stdout.write('Creating 20 test instrumentos-empresa records...')
        
        # Get cliente with id 1
        try:
            cliente = Cliente.objects.get(id=1)
            self.stdout.write(f'Using cliente: {cliente.empresa.razao_social if hasattr(cliente, "empresa") else cliente.id}')
        except Cliente.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Cliente with id=1 does not exist. Please create it first.')
            )
            return
        
        # Sample data for variety
        instrumentos_data = [
            {
                'descricao': 'Paquímetro',
                'modelo': 'Digital 150mm',
                'fabricante': 'Mitutoyo',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('150.00'),
                'unidade': 'mm',
                'resolucao': 0.01,
                'capacidade_medicao': 150.0,
                'unidade_capacidade': 'mm',
                'procedimento': 'PROC-001',
                'preco_cliente': Decimal('250.00'),
                'preco_laboratorio': Decimal('200.00'),
            },
            {
                'descricao': 'Balança Analítica',
                'modelo': 'AUW220D',
                'fabricante': 'Shimadzu',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('220.00'),
                'unidade': 'g',
                'resolucao': 0.0001,
                'capacidade_medicao': 220.0,
                'unidade_capacidade': 'g',
                'procedimento': 'PROC-002',
                'preco_cliente': Decimal('350.00'),
                'preco_laboratorio': Decimal('300.00'),
            },
            {
                'descricao': 'Micrômetro',
                'modelo': 'MDC-25MX',
                'fabricante': 'Mitutoyo',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.ANALOGICO,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('25.00'),
                'unidade': 'mm',
                'resolucao': 0.001,
                'capacidade_medicao': 25.0,
                'unidade_capacidade': 'mm',
                'procedimento': 'PROC-003',
                'preco_cliente': Decimal('180.00'),
                'preco_laboratorio': Decimal('150.00'),
            },
            {
                'descricao': 'Termômetro Digital',
                'modelo': 'DT-3891G',
                'fabricante': 'CEM',
                'tipo_servico': TipoServico.NAO_ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('-50.00'),
                'maximo': Decimal('200.00'),
                'unidade': '°C',
                'resolucao': 0.1,
                'capacidade_medicao': 200.0,
                'unidade_capacidade': '°C',
                'procedimento': 'PROC-004',
                'preco_cliente': Decimal('120.00'),
                'preco_laboratorio': Decimal('100.00'),
            },
            {
                'descricao': 'Multímetro',
                'modelo': 'Fluke 87V',
                'fabricante': 'Fluke',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('1000.00'),
                'unidade': 'V',
                'resolucao': 0.01,
                'capacidade_medicao': 1000.0,
                'unidade_capacidade': 'V',
                'procedimento': 'PROC-005',
                'preco_cliente': Decimal('400.00'),
                'preco_laboratorio': Decimal('350.00'),
            },
            {
                'descricao': 'Régua Graduada',
                'modelo': '500mm',
                'fabricante': 'Starrett',
                'tipo_servico': TipoServico.INTERNO,
                'tipo_sinal': TipoSinal.ANALOGICO,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('500.00'),
                'unidade': 'mm',
                'resolucao': 0.5,
                'capacidade_medicao': 500.0,
                'unidade_capacidade': 'mm',
                'procedimento': 'PROC-006',
                'preco_cliente': Decimal('80.00'),
                'preco_laboratorio': Decimal('60.00'),
            },
            {
                'descricao': 'Manômetro',
                'modelo': 'PM-100',
                'fabricante': 'Wika',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.ANALOGICO,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('10.00'),
                'unidade': 'bar',
                'resolucao': 0.1,
                'capacidade_medicao': 10.0,
                'unidade_capacidade': 'bar',
                'procedimento': 'PROC-007',
                'preco_cliente': Decimal('220.00'),
                'preco_laboratorio': Decimal('180.00'),
            },
            {
                'descricao': 'Cronômetro Digital',
                'modelo': 'HS-80W',
                'fabricante': 'Casio',
                'tipo_servico': TipoServico.NAO_ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('999.99'),
                'unidade': 's',
                'resolucao': 0.01,
                'capacidade_medicao': 999.99,
                'unidade_capacidade': 's',
                'procedimento': 'PROC-008',
                'preco_cliente': Decimal('90.00'),
                'preco_laboratorio': Decimal('70.00'),
            },
            {
                'descricao': 'Calibrador de Pressão',
                'modelo': 'CPC-6000',
                'fabricante': 'Fluke',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('100.00'),
                'unidade': 'psi',
                'resolucao': 0.01,
                'capacidade_medicao': 100.0,
                'unidade_capacidade': 'psi',
                'procedimento': 'PROC-009',
                'preco_cliente': Decimal('1200.00'),
                'preco_laboratorio': Decimal('1000.00'),
            },
            {
                'descricao': 'Trena Laser',
                'modelo': 'Disto D2',
                'fabricante': 'Leica',
                'tipo_servico': TipoServico.NAO_ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('100.00'),
                'unidade': 'm',
                'resolucao': 0.001,
                'capacidade_medicao': 100.0,
                'unidade_capacidade': 'm',
                'procedimento': 'PROC-010',
                'preco_cliente': Decimal('800.00'),
                'preco_laboratorio': Decimal('650.00'),
            },
            {
                'descricao': 'Medidor de Espessura',
                'modelo': 'DM-4',
                'fabricante': 'Elcometer',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('5.00'),
                'unidade': 'mm',
                'resolucao': 0.001,
                'capacidade_medicao': 5.0,
                'unidade_capacidade': 'mm',
                'procedimento': 'PROC-011',
                'preco_cliente': Decimal('450.00'),
                'preco_laboratorio': Decimal('380.00'),
            },
            {
                'descricao': 'Goniômetro',
                'modelo': 'Universal',
                'fabricante': 'Starrett',
                'tipo_servico': TipoServico.INTERNO,
                'tipo_sinal': TipoSinal.ANALOGICO,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('180.00'),
                'unidade': '°',
                'resolucao': 0.5,
                'capacidade_medicao': 180.0,
                'unidade_capacidade': '°',
                'procedimento': 'PROC-012',
                'preco_cliente': Decimal('150.00'),
                'preco_laboratorio': Decimal('120.00'),
            },
            {
                'descricao': 'Medidor de pH',
                'modelo': 'pH-200',
                'fabricante': 'Hanna',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('14.00'),
                'unidade': 'pH',
                'resolucao': 0.01,
                'capacidade_medicao': 14.0,
                'unidade_capacidade': 'pH',
                'procedimento': 'PROC-013',
                'preco_cliente': Decimal('280.00'),
                'preco_laboratorio': Decimal('230.00'),
            },
            {
                'descricao': 'Medidor de Umidade',
                'modelo': 'HM-150',
                'fabricante': 'Extech',
                'tipo_servico': TipoServico.NAO_ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('100.00'),
                'unidade': '%RH',
                'resolucao': 0.1,
                'capacidade_medicao': 100.0,
                'unidade_capacidade': '%RH',
                'procedimento': 'PROC-014',
                'preco_cliente': Decimal('190.00'),
                'preco_laboratorio': Decimal('160.00'),
            },
            {
                'descricao': 'Medidor de Vazão',
                'modelo': 'FM-200',
                'fabricante': 'Omega',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('200.00'),
                'unidade': 'L/min',
                'resolucao': 0.1,
                'capacidade_medicao': 200.0,
                'unidade_capacidade': 'L/min',
                'procedimento': 'PROC-015',
                'preco_cliente': Decimal('550.00'),
                'preco_laboratorio': Decimal('480.00'),
            },
            {
                'descricao': 'Medidor de Temperatura',
                'modelo': 'TM-400',
                'fabricante': 'Testo',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('-200.00'),
                'maximo': Decimal('1370.00'),
                'unidade': '°C',
                'resolucao': 0.1,
                'capacidade_medicao': 1370.0,
                'unidade_capacidade': '°C',
                'procedimento': 'PROC-016',
                'preco_cliente': Decimal('320.00'),
                'preco_laboratorio': Decimal('270.00'),
            },
            {
                'descricao': 'Medidor de Dureza',
                'modelo': 'Rockwell HR-150',
                'fabricante': 'Mitutoyo',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.ANALOGICO,
                'minimo': Decimal('20.00'),
                'maximo': Decimal('100.00'),
                'unidade': 'HRC',
                'resolucao': 0.1,
                'capacidade_medicao': 100.0,
                'unidade_capacidade': 'HRC',
                'procedimento': 'PROC-017',
                'preco_cliente': Decimal('950.00'),
                'preco_laboratorio': Decimal('800.00'),
            },
            {
                'descricao': 'Medidor de Rugosidade',
                'modelo': 'SJ-210',
                'fabricante': 'Mitutoyo',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('350.00'),
                'unidade': 'μm',
                'resolucao': 0.001,
                'capacidade_medicao': 350.0,
                'unidade_capacidade': 'μm',
                'procedimento': 'PROC-018',
                'preco_cliente': Decimal('1100.00'),
                'preco_laboratorio': Decimal('950.00'),
            },
            {
                'descricao': 'Medidor de Força',
                'modelo': 'DFG-50',
                'fabricante': 'Shimadzu',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('50000.00'),
                'unidade': 'N',
                'resolucao': 0.1,
                'capacidade_medicao': 50000.0,
                'unidade_capacidade': 'N',
                'procedimento': 'PROC-019',
                'preco_cliente': Decimal('1500.00'),
                'preco_laboratorio': Decimal('1300.00'),
            },
            {
                'descricao': 'Medidor de Torque',
                'modelo': 'TT-200',
                'fabricante': 'Norbar',
                'tipo_servico': TipoServico.ACREDITADO,
                'tipo_sinal': TipoSinal.DIGITAL,
                'minimo': Decimal('0.00'),
                'maximo': Decimal('200.00'),
                'unidade': 'Nm',
                'resolucao': 0.01,
                'capacidade_medicao': 200.0,
                'unidade_capacidade': 'Nm',
                'procedimento': 'PROC-020',
                'preco_cliente': Decimal('680.00'),
                'preco_laboratorio': Decimal('580.00'),
            },
        ]

        created_count = 0
        
        for data in instrumentos_data:
            try:
                # Get or create TipoInstrumento
                tipo_instrumento, _ = TipoInstrumento.objects.get_or_create(
                    descricao=data['descricao'],
                    modelo=data['modelo'],
                    fabricante=data['fabricante'],
                    defaults={'resolucao': data.get('resolucao')}
                )
                
                # Get or create CapacidadeMedicao if provided
                capacidade_medicao = None
                if data.get('capacidade_medicao') and data.get('unidade_capacidade'):
                    capacidade_medicao, _ = CapacidadeMedicao.objects.get_or_create(
                        valor=data['capacidade_medicao'],
                        unidade=data['unidade_capacidade']
                    )
                
                # Get or create Procedimento if provided
                procedimento_relacionado = None
                if data.get('procedimento'):
                    procedimento_relacionado, _ = Procedimento.objects.get_or_create(
                        codigo=data['procedimento']
                    )
                
                # Create Instrumento
                instrumento = Instrumento.objects.create(
                    tipo_de_instrumento=tipo_instrumento,
                    tipo_de_servico=data['tipo_servico'],
                    tipo_sinal=data['tipo_sinal'],
                    minimo=data.get('minimo'),
                    maximo=data.get('maximo'),
                    unidade=data.get('unidade'),
                    capacidade_de_medicao=capacidade_medicao,
                    procedimento_relacionado=procedimento_relacionado,
                    preco_calibracao_no_cliente=data.get('preco_cliente'),
                    preco_calibracao_no_laboratorio=data.get('preco_laboratorio'),
                )
                
                # Create InstrumentoBaseCliente relationship for cliente id 1
                InstrumentoBaseCliente.objects.get_or_create(
                    instrumento=instrumento,
                    cliente=cliente,
                    defaults={'ativo': True}
                )
                
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created: {data["descricao"]} - {data["modelo"]} / {data["fabricante"]} (linked to cliente id=1)'
                    )
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Error creating {data.get("descricao", "unknown")}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} instrumentos-empresa records and linked them to cliente id=1!'
            )
        )

