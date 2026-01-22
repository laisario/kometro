import logging
from collections import defaultdict
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task
def criar_ordens_servico_proposta(proposta_id):
    """
    Creates OrdemServico records grouped by tipo_de_instrumento
    and generates numero_certificado for each instrument.
    
    Triggered when a Proposta status changes to "A" (Aprovada).
    
    Numero generation:
    - OrdemServico.numero: {proposta.numero}-OS{sequence}
    - InstrumentoDoCliente.numero_certificado: {ordem.numero}-{sequence:03d}
    """
    from propostas.models import Proposta
    from ordem_servico.models import OrdemServico
    
    try:
        proposta = Proposta.objects.get(id=proposta_id)
    except Proposta.DoesNotExist:
        logger.error(f"Proposta {proposta_id} not found")
        return
    
    if OrdemServico.objects.filter(proposta=proposta).exists():
        logger.warning(f"OrdemServico already exists for Proposta {proposta.numero}")
        return
    
    instrumentos = proposta.instrumentos.select_related(
        'instrumento__tipo_de_instrumento'
    ).all()
    
    if not instrumentos.exists():
        logger.warning(f"No instruments found for Proposta {proposta.numero}")
        return
    
    # Group instruments by tipo_de_instrumento
    grupos = defaultdict(list)
    for inst in instrumentos:
        tipo_id = inst.instrumento.tipo_de_instrumento_id
        grupos[tipo_id].append(inst)
    
    logger.info(f"Creating {len(grupos)} OrdemServico for Proposta {proposta.numero}")
    
    with transaction.atomic():
        # Create OrdemServico for each group
        for seq, (tipo_id, insts) in enumerate(grupos.items(), start=1):
            numero = f"{proposta.numero}-OS{seq}"
            
            ordem = OrdemServico.objects.create(
                proposta=proposta,
                numero=numero,
                data_expiracao=proposta.validade,  # Copy from Proposta.validade
                responsavel=None
            )
            ordem.instrumentos.set(insts)
            
            # Generate numero_certificado for each instrument
            for cert_seq, inst in enumerate(insts, start=1):
                inst.numero_certificado = f"{numero}-{cert_seq:03d}"
                inst.save(update_fields=['numero_certificado'])
            
            logger.info(f"Created OrdemServico {numero} with {len(insts)} instruments")
    
    logger.info(f"Successfully created all OrdemServico for Proposta {proposta.numero}")
    return True
