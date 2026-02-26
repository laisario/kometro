"""
Management command para limpar duplicatas de TipoInstrumento.

Este comando identifica e consolida duplicatas perfeitas de TipoInstrumento,
reapontando todas as referências de Instrumento para o registro canônico (menor id)
e deletando os duplicados.

Uso:
    # Modo dry-run (apenas mostra o que seria feito, sem fazer alterações)
    python manage.py cleanup_tipo_instrumento_duplicates --dry-run

    # Executar de fato (faz as alterações no banco)
    python manage.py cleanup_tipo_instrumento_duplicates

    # Verbose (mostra mais detalhes)
    python manage.py cleanup_tipo_instrumento_duplicates --verbose
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Q
from instrumentos.models import TipoInstrumento, Instrumento
import logging

logger = logging.getLogger(__name__)


def _normalize_for_comparison(tipo):
    """
    Normaliza campos de TipoInstrumento para comparação.
    Trata NULL e "" como equivalentes.
    """
    return {
        'descricao': (tipo.descricao or '').strip().lower(),
        'modelo': (tipo.modelo or '').strip().lower() if tipo.modelo else None,
        'fabricante': (tipo.fabricante or '').strip().lower() if tipo.fabricante else None,
        'resolucao': tipo.resolucao,
    }


def _are_duplicates(tipo1, tipo2):
    """
    Verifica se dois TipoInstrumento são duplicatas perfeitas.
    """
    norm1 = _normalize_for_comparison(tipo1)
    norm2 = _normalize_for_comparison(tipo2)
    
    return (
        norm1['descricao'] == norm2['descricao'] and
        norm1['modelo'] == norm2['modelo'] and
        norm1['fabricante'] == norm2['fabricante'] and
        norm1['resolucao'] == norm2['resolucao']
    )


class Command(BaseCommand):
    help = 'Limpa duplicatas perfeitas de TipoInstrumento, consolidando em um registro canônico'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Apenas mostra o que seria feito, sem fazer alterações no banco',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Mostra informações detalhadas sobre cada duplicata encontrada',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        
        self.stdout.write(self.style.WARNING(
            f"🔍 Buscando duplicatas de TipoInstrumento..."
            f"{' (DRY-RUN - nenhuma alteração será feita)' if dry_run else ''}"
        ))
        
        # Buscar todos os TipoInstrumento
        all_tipos = TipoInstrumento.objects.all().order_by('id')
        
        # Agrupar duplicatas
        duplicates_groups = []
        processed_ids = set()
        
        for tipo in all_tipos:
            if tipo.id in processed_ids:
                continue
            
            # Encontrar todos os duplicados deste tipo
            group = [tipo]
            for other in all_tipos:
                if other.id == tipo.id or other.id in processed_ids:
                    continue
                if _are_duplicates(tipo, other):
                    group.append(other)
                    processed_ids.add(other.id)
            
            if len(group) > 1:
                # Ordenar por id para escolher o canônico (menor id)
                group.sort(key=lambda x: x.id)
                duplicates_groups.append(group)
                processed_ids.add(tipo.id)
        
        if not duplicates_groups:
            self.stdout.write(self.style.SUCCESS(
                "✅ Nenhuma duplicata perfeita encontrada!"
            ))
            return
        
        self.stdout.write(self.style.WARNING(
            f"\n📊 Encontradas {len(duplicates_groups)} grupos de duplicatas"
        ))
        
        total_to_delete = 0
        total_instrumentos_to_update = 0
        
        # Mostrar estatísticas
        for i, group in enumerate(duplicates_groups, 1):
            canonical = group[0]  # Menor id
            duplicates = group[1:]
            
            # Contar quantos Instrumento usam cada duplicata
            instrumentos_count = {}
            for dup in group:
                count = Instrumento.objects.filter(tipo_de_instrumento=dup).count()
                instrumentos_count[dup.id] = count
                if dup.id != canonical.id:
                    total_instrumentos_to_update += count
            
            total_to_delete += len(duplicates)
            
            if verbose:
                self.stdout.write(f"\n{'='*80}")
                self.stdout.write(f"Grupo {i}: {len(group)} duplicatas")
                self.stdout.write(f"  Canônico (manter): ID={canonical.id}")
                self.stdout.write(f"    descricao: {canonical.descricao}")
                self.stdout.write(f"    modelo: {canonical.modelo or '(vazio)'}")
                self.stdout.write(f"    fabricante: {canonical.fabricante or '(vazio)'}")
                self.stdout.write(f"    resolucao: {canonical.resolucao or '(vazio)'}")
                self.stdout.write(f"    Instrumentos usando: {instrumentos_count[canonical.id]}")
                
                for dup in duplicates:
                    self.stdout.write(f"  Duplicata (deletar): ID={dup.id}")
                    self.stdout.write(f"    Instrumentos usando: {instrumentos_count[dup.id]}")
            else:
                self.stdout.write(
                    f"  Grupo {i}: {len(group)} duplicatas "
                    f"(canônico: ID={canonical.id}, "
                    f"deletar: {[d.id for d in duplicates]}, "
                    f"instrumentos a atualizar: {sum(instrumentos_count[d.id] for d in duplicates)})"
                )
        
        self.stdout.write(f"\n📈 Resumo:")
        self.stdout.write(f"  - Grupos de duplicatas: {len(duplicates_groups)}")
        self.stdout.write(f"  - Registros a deletar: {total_to_delete}")
        self.stdout.write(f"  - Instrumentos a atualizar: {total_instrumentos_to_update}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING(
                "\n⚠️  DRY-RUN: Nenhuma alteração foi feita."
            ))
            self.stdout.write("Execute sem --dry-run para aplicar as mudanças.")
            return
        
        # Confirmar antes de executar
        self.stdout.write(self.style.WARNING(
            f"\n⚠️  ATENÇÃO: Esta operação irá:"
            f"\n   - Atualizar {total_instrumentos_to_update} Instrumento(s)"
            f"\n   - Deletar {total_to_delete} TipoInstrumento(s)"
        ))
        
        confirm = input("\nDeseja continuar? (digite 'sim' para confirmar): ")
        if confirm.lower() != 'sim':
            self.stdout.write(self.style.ERROR("Operação cancelada."))
            return
        
        # Executar limpeza
        self.stdout.write("\n🔄 Executando limpeza...")
        
        try:
            with transaction.atomic():
                updated_count = 0
                deleted_count = 0
                
                for group in duplicates_groups:
                    canonical = group[0]
                    duplicates = group[1:]
                    
                    # Reapontar todos os Instrumento dos duplicados para o canônico
                    for dup in duplicates:
                        count = Instrumento.objects.filter(
                            tipo_de_instrumento=dup
                        ).update(tipo_de_instrumento=canonical)
                        updated_count += count
                        
                        if verbose:
                            self.stdout.write(
                                f"  ✓ Atualizados {count} Instrumento(s) "
                                f"de TipoInstrumento ID={dup.id} para ID={canonical.id}"
                            )
                    
                    # Deletar duplicados
                    dup_ids = [d.id for d in duplicates]
                    deleted, _ = TipoInstrumento.objects.filter(id__in=dup_ids).delete()
                    deleted_count += deleted
                    
                    if verbose:
                        self.stdout.write(
                            f"  ✓ Deletados {len(duplicates)} TipoInstrumento(s): {dup_ids}"
                        )
                
                self.stdout.write(self.style.SUCCESS(
                    f"\n✅ Limpeza concluída com sucesso!"
                    f"\n   - Instrumentos atualizados: {updated_count}"
                    f"\n   - TipoInstrumento deletados: {deleted_count}"
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"\n❌ Erro durante a limpeza: {e}"
            ))
            raise
