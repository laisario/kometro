import logging
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)
from propostas.models import Proposta
from propostas.models import PropostaInstrumento
from propostas.services import recompute_total
from ordem_servico.models import OrdemServico
from ordem_servico.utils import agrupar_instrumentos_os, criar_os_do_grupo
from instrumentos.models import InstrumentoDoCliente, Local, TipoServico


@shared_task(
    bind=True,
    max_retries=3,
    name="ordem_servico.tasks.criar_ordens_servico_proposta",
)
def criar_ordens_servico_proposta(self, proposta_id):
    """
    Create OrdemServico records for approved proposal.
    
    Idempotent: checks if OS already exist before creating.
    Retries: 3 times with exponential backoff.
    
    Grouping logic:
    - Location (cliente / permanente / terceirizado) - from proposal selection
    - Service type (acreditado / nao_acreditado) - from instrument.tipo_de_servico
    - Service kind (calibracao / manutencao) - from proposal selection
    - Special case: if instrument is a scale (balança), group into OS Balanças
    """
    
    try:
        proposta = Proposta.objects.select_related('cliente').get(id=proposta_id)
    except Proposta.DoesNotExist:
        logger.error(f"Proposta {proposta_id} not found")
        raise
    
    # Idempotency check
    if proposta.ordens_servico.exists():
        logger.info(f"OS already exist for proposta {proposta_id}")
        return {"status": "already_exists", "os_count": proposta.ordens_servico.count()}
    
    # Get instrument selections from proposta
    instrumentos_data = proposta.get_instrumentos_selecoes()
    
    if not instrumentos_data:
        logger.warning(f"No instrument selections found for proposta {proposta_id}")
        # Fallback: try to use old format (backward compatibility)
        instrumentos = proposta.instrumentos.select_related(
            'instrumento__tipo_de_instrumento'
        ).all()
        
        if not instrumentos.exists():
            logger.warning(f"No instruments found for proposta {proposta_id}")
            return {"status": "no_instruments"}
        
        instrumentos_data = {}
        for instrumento in instrumentos:
            instrumentos_data[instrumento.id] = {
                'instrumento': instrumento,
                'service_kind': 'calibracao',  # Default
                'local': proposta.local,
                'tipo_servico': instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO,
            }
    
    grupos = agrupar_instrumentos_os(list(instrumentos_data.values()))
    
    if not grupos:
        logger.warning(f"No groups created for proposta {proposta_id}")
        return {"status": "no_groups"}
    
    os_created = []
    try:
        with transaction.atomic():
            for grupo_key, instrumentos in grupos.items():
                os = criar_os_do_grupo(proposta, grupo_key, instrumentos)
                os_created.append(os.id)
                logger.info(f"Created OS {os.numero} for group {grupo_key}")
        
        logger.info(f"Created {len(os_created)} OS for proposta {proposta_id}")
        return {"status": "success", "os_ids": os_created}
        
    except Exception as exc:
        logger.error(f"Error creating OS for proposta {proposta_id}: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(
    bind=True,
    max_retries=3,
    name="ordem_servico.tasks.criar_proposta_visita_tecnica",
)
def criar_proposta_visita_tecnica(self, ordem_servico_id, instrumento_ids, informacoes_adicionais=None):
    """
    Create a Proposal from a completed Technical Visit OS.

    The client comes from the Technical Visit OS and selected instruments must
    belong to that same client. This task intentionally does not create
    operational OS records; those are still created only after Proposal approval.
    """
    try:
        ordem_servico = OrdemServico.objects.select_related('cliente').get(id=ordem_servico_id)
        cliente = ordem_servico.resolved_cliente

        if not cliente:
            raise ValueError("Technical Visit OS must have a client.")

        instrumentos = list(
            InstrumentoDoCliente.objects.filter(
                id__in=instrumento_ids,
                cliente=cliente,
            )
        )
        found_ids = {instrumento.id for instrumento in instrumentos}
        missing_ids = set(instrumento_ids) - found_ids
        if missing_ids:
            raise ValueError(f"Invalid instrument IDs for client {cliente.id}: {sorted(missing_ids)}")

        with transaction.atomic():
            proposta = Proposta.objects.create(
                cliente=cliente,
                informacoes_adicionais=informacoes_adicionais or "",
            )

            if instrumentos:
                proposta.instrumentos.set(instrumentos)
                for instrumento in instrumentos:
                    local = getattr(proposta, "local", None) or Local.PERMANENTE
                    PropostaInstrumento.objects.create(
                        proposta=proposta,
                        instrumento=instrumento,
                        service_kind='calibracao',
                        local=local,
                    )
                recompute_total(proposta)

        return {"status": "success", "proposta_id": proposta.id}
    except Exception as exc:
        logger.error(f"Error creating proposal from Technical Visit OS {ordem_servico_id}: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
