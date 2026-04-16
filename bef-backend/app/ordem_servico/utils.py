"""
Utilities for OS grouping and generation logic.
"""
import logging
from collections import defaultdict
from instrumentos.models import Local, TipoServico
from .models import TipoOS, StatusOS, OrdemServico, InstrumentoOS

logger = logging.getLogger(__name__)


def is_instrumento_balanca(instrumento):
    """
    Check if instrument is a scale by TipoInstrumento.descricao.
    Case-insensitive check for "balança" or "balanca" in the description.
    """
    if not instrumento or not instrumento.instrumento or not instrumento.instrumento.tipo_de_instrumento:
        return False
    
    descricao = instrumento.instrumento.tipo_de_instrumento.descricao.lower()
    return "balança" in descricao or "balanca" in descricao


def agrupar_instrumentos_os(instrumentos_data):
    """
    Group instruments into OS based on:
    1. If instrument is scale (balança) → OS Balanças
    2. Location (cliente / permanente / terceirizado) - from proposal selection
    3. Service type (acreditado / nao_acreditado) - from InstrumentoDoCliente.tipo_de_servico
    4. Service kind (calibracao / manutencao) - from proposal selection
    
    Args:
        instrumentos_data: List of dicts with keys:
            - 'instrumento': InstrumentoDoCliente instance
            - 'service_kind': 'calibracao' or 'manutencao'
            - 'local': 'C', 'P', or 'T'
            - 'tipo_servico': 'A' or 'NA' (from instrument)
    
    Returns:
        dict with keys like:
        - "BAL-{local}-{tipo_servico}-{service_kind}"
        - "CAL-{local}-{tipo_servico}"
        - "MAN-{local}-{tipo_servico}"
        - "EXT-{local}-{tipo_servico}-{service_kind}"
        Values are lists of instrument data dicts.
    """
    grupos = defaultdict(list)
    
    for inst_data in instrumentos_data:
        instrumento = inst_data['instrumento']
        local = inst_data['local']
        tipo_servico = instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO
        service_kind = inst_data['service_kind']  # 'calibracao' or 'manutencao'
        
        # Check if scale
        is_balanca = is_instrumento_balanca(instrumento)
        
        if is_balanca:
            tipo_os = TipoOS.BALANCAS
        elif local == Local.TERCEIRIZADA:
            tipo_os = TipoOS.SERVICOS_EXTERNOS
        elif service_kind == "calibracao":
            tipo_os = TipoOS.CALIBRACAO
        elif service_kind == "manutencao":
            tipo_os = TipoOS.MANUTENCAO
        else:
            raise ValueError(f"Invalid service_kind: {service_kind}")
        
        # Group key
        # Convert tipo_os to string value to ensure correct formatting in grupo_key
        # tipo_os is a TextChoices constant, we need its string value for the key
        tipo_os_str = tipo_os if isinstance(tipo_os, str) else tipo_os.value if hasattr(tipo_os, 'value') else str(tipo_os)
        if tipo_os == TipoOS.BALANCAS:
            key = f"{tipo_os_str}-{local}-{tipo_servico}-{service_kind}"
        else:
            key = f"{tipo_os_str}-{local}-{tipo_servico}"
        
        grupos[key].append(inst_data)
    
    return grupos


def criar_os_do_grupo(proposta, grupo_key, instrumentos_data):
    """
    Create an OrdemServico for a group of instruments.
    
    Args:
        proposta: Proposta instance
        grupo_key: Group key like "CAL-P-A" or "BAL-C-A-calibracao"
        instrumentos_data: List of instrument data dicts
    
    Returns:
        OrdemServico instance
    """
    
    # Parse grupo_key to extract tipo_os, local, tipo_servico, service_kind
    parts = grupo_key.split('-')
    tipo_os = parts[0]
    local = parts[1]
    tipo_servico = parts[2]
    service_kind = parts[3] if len(parts) > 3 else None
    
    # Generate OS number
    os_count = proposta.ordens_servico.filter(tipo_os=tipo_os).count() + 1
    numero = f"{proposta.numero}-OS-{tipo_os}-{os_count:03d}"
    
    # Create OS
    ordem_servico = OrdemServico.objects.create(
        proposta=proposta,
        tipo_os=tipo_os,
        status=StatusOS.A_REALIZAR,
        numero=numero
    )
    
    # Create InstrumentoOS records
    for item_seq, inst_data in enumerate(instrumentos_data, start=1):
        instrumento = inst_data['instrumento']
        
        # Create InstrumentoOS with type-specific fields
        instrumento_os = InstrumentoOS.objects.create(
            ordem_servico=ordem_servico,
            instrumento=instrumento,
            item=item_seq,
            observacao=None,
        )
        
        # Set type-specific fields based on OS type
        # tipo_os is a string extracted from grupo_key: "CAL", "MAN", "EXT", or "BAL"
        # Compare with string values to ensure correct behavior
        if tipo_os == "CAL" or tipo_os == TipoOS.CALIBRACAO:
            instrumento_os.local = local
            # tipo_servico is now a computed property (from instrumento.instrumento.tipo_de_servico)
            # No need to set it explicitly
        elif tipo_os == "BAL" or tipo_os == TipoOS.BALANCAS:
            # Balanças fields can be set later
            pass
        elif tipo_os == "MAN" or tipo_os == TipoOS.MANUTENCAO:
            # Manutenção fields can be set later
            pass
        elif tipo_os == "EXT" or tipo_os == TipoOS.SERVICOS_EXTERNOS:
            # Serviços Externos fields can be set later
            pass
        
        instrumento_os.save()
        
        # Generate certificate number ONLY for CALIBRACAO OS type
        # Business rule: Certificate numbers are auto-generated ONLY for OS type CALIBRACAO
        # For other types (BALANCAS, MANUTENCAO, SERVICOS_EXTERNOS), certificate must be assigned manually
        # tipo_os comes from parts[0] which is a string extracted from grupo_key
        # grupo_key format: "CAL-P-A", "MAN-P-A", "EXT-P-A", "BAL-C-A-calibracao"
        # So tipo_os will be "CAL", "MAN", "EXT", or "BAL" as strings
        # IMPORTANT: tipo_os is a STRING extracted from grupo_key, so we must compare with "CAL" string
        # Do NOT generate certificate for MAN, EXT, or BAL - only for CAL
        if tipo_os == "CAL":
            # Only generate certificate for CALIBRACAO OS type
            numero_certificado = f"{numero}-{item_seq:03d}"
            instrumento.numero_certificado = numero_certificado
            instrumento.save(update_fields=['numero_certificado'])
            logger.info(f"Generated certificate {numero_certificado} for instrument {instrumento.id} (OS type: {tipo_os})")
        else:
            logger.info(f"Skipping certificate generation for instrument {instrumento.id} (OS type: {tipo_os} - not CALIBRACAO)")
    
    return ordem_servico
