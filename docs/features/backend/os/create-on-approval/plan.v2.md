# OrdemServico Auto-Generation on Proposal Approval - V2

> **Version**: 2.0  
> **Status**: Planning  
> **Supersedes**: [plan.md](./plan.md) (V1)  
> **Date**: 2025-01-XX

## Overview

This document describes V2 of the OrdemServico (OS) auto-generation feature. V2 introduces:
- Multiple OS types (Calibração, Balanças, Manutenção, Serviços Externos)
- Per-instrument service selection (calibração/manutenção, location, accredited flag)
- Advanced grouping rules based on multiple criteria
- OS status workflow
- Type-specific fields and models
- Certificate generation logic per OS type

**V1 is kept for historical reference** but is superseded by this version.

## Implementation Status

### ✅ Implemented

- **Models**: 
  - `OrdemServico` model with `tipo_os`, `status`, and type-specific date fields
  - `InstrumentoOS` through model with all type-specific fields
  - `marca_selagem_retirada` field (string) added to `InstrumentoOS`
  - Computed properties: `carga_maxima` and `tipo_servico` (from `instrumento.instrumento`)
- **Migrations**: 
  - Initial migration (0001_initial)
  - Migration for type-specific fields and InstrumentoOS (0002)
  - Migration for `marca_selagem_retirada` (0003)
- **Serializers**: 
  - `OrdemServicoSerializer` for list views
  - `OrdemServicoDetailSerializer` for detail views with instruments
  - `InstrumentoOSSerializer` with computed properties and `marca_selagem_retirada`
  - `OrdemServicoUpdateSerializer` for updates
- **Views/Endpoints**: 
  - `GET /api/ordens-servico/` - List OS (staff only)
  - `GET /api/ordens-servico/{id}/` - Get OS detail
  - `GET /api/ordens-servico/minhas/` - Get current user's OS
  - `PATCH /api/ordens-servico/{id}/` - Update OS (gerente only)
  - `POST /api/ordens-servico/{id}/reallocar/` - Move instrument to another OS
  - `POST /api/ordens-servico/{id}/gerar-certificado/` - Generate certificate
  - `PATCH /api/ordens-servico/{id}/finalizar/` - Mark OS as "realizado"
- **Celery Task**: 
  - `criar_ordens_servico_proposta` task with idempotency and retries
- **Grouping Logic**: 
  - `agrupar_instrumentos_os()` function with multi-criteria grouping
  - `is_instrumento_balanca()` function for scale detection
  - `criar_os_do_grupo()` function for OS creation
- **Status Machine**: 
  - `pode_transicionar_status()` method on `OrdemServico`
- **Certificate Generation**: 
  - Auto-generation for calibration OS
  - Manual generation endpoint for other OS types

### ❌ Missing / Partial

- **Tests**: 
  - Unit tests for OS creation task
  - Tests for grouping logic
  - Tests for status transitions
  - Tests for computed properties (`carga_maxima`, `tipo_servico`)
  - Tests for `marca_selagem_retirada` field persistence
- **Documentation**: 
  - API documentation examples updated with new fields
  - Migration guide for removing deprecated DB fields (future)

### Notes

- `carga_maxima` and `tipo_servico` are implemented as computed properties (not stored in DB)
- DB fields for these exist for backward compatibility but are deprecated
- `marca_selagem_retirada` is a string field (CharField), similar to other string fields in the model
- All endpoints require appropriate permissions (staff/gerente)

## Feature Summary

When a `Proposta` status changes to "A" (Aprovada), automatically create `OrdemServico` records grouped by:
- Location (cliente / instalacoes_permanentes / terceirizado) - from proposal selection
- Service type (acreditado / nao_acreditado) - from instrument (`Instrumento.tipo_de_servico`)
- Service kind (calibracao / manutencao) - from proposal selection
- Special case: if instrument is a scale (balança), group into OS Balanças

Each OS is created with status "a_realizar" and instruments are linked. Certificate numbers are generated based on OS type.

## Scope

### What Changes

1. **Proposta Model**: Stores per-instrument service selections (see proposal feature doc)
2. **OrdemServico Model**: 
   - Adds `status` field with workflow
   - Adds `tipo_os` field to distinguish OS types
3. **New Models**:
   - `InstrumentoOS` - Links instruments to OS with type-specific fields
   - `OSCalibracao`, `OSBalancas`, `OSManutencao`, `OSServicosExternos` - Type-specific data
4. **Grouping Logic**: Multi-criteria grouping instead of simple tipo_instrumento grouping
5. **Certificate Generation**: Different logic per OS type
6. **OS Management**: Reallocation and certificate generation features

### Non-Goals

- Manual OS creation (only auto-generated on approval)
- Changing OS type after creation
- Bulk operations on OS
- OS templates or cloning

## Data Model Changes

### Computed Properties

The following fields are **computed properties** (not stored in the database):
- `carga_maxima`: Returns `instrumento.instrumento.maximo`. Returns `None` if any link in the chain is missing.
- `tipo_servico`: Returns `instrumento.instrumento.tipo_de_servico`. Returns `None` if any link in the chain is missing.

These are implemented as `@property` methods on the `InstrumentoOS` model. DB fields with the same names exist for backward compatibility but are deprecated and should not be used. Serializers use `SerializerMethodField` to explicitly call the property methods.

### OrdemServico Model

```python
class TipoOS(models.TextChoices):
    CALIBRACAO = "CAL", _("OS Calibração")
    BALANCAS = "BAL", _("OS Balanças")
    MANUTENCAO = "MAN", _("OS Manutenção")
    SERVICOS_EXTERNOS = "EXT", _("OS Serviços Externos")

class StatusOS(models.TextChoices):
    A_REALIZAR = "AR", _("A realizar")
    EM_ANDAMENTO = "EA", _("Em andamento")
    REALIZADO = "RE", _("Realizado")
    CANCELADO = "CA", _("Cancelado")

class OrdemServico(models.Model):
    proposta = models.ForeignKey("propostas.Proposta", ...)
    responsavel = models.ForeignKey(User, ...)
    numero = models.CharField(max_length=25, unique=True)
    tipo_os = models.CharField(
        max_length=3,
        choices=TipoOS.choices,
        verbose_name="Tipo de OS"
    )
    status = models.CharField(
        max_length=2,
        choices=StatusOS.choices,
        default=StatusOS.A_REALIZAR,
        verbose_name="Status"
    )
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_expiracao = models.DateField(null=True, blank=True)
    
    # Type-specific fields (nullable, populated based on tipo_os)
    data_recebimento_instrumentos = models.DateField(null=True, blank=True)  # Calibração
    data_liberacao_instrumentos = models.DateField(null=True, blank=True)  # Calibração, Manutenção
    data_calibracao_instrumentos = models.DateField(null=True, blank=True)  # Serviços Externos
    data_liberacao_calibracao = models.DateField(null=True, blank=True)  # Serviços Externos
    
    # Relationships via InstrumentoOS (replaces ManyToMany)
    instrumentos = models.ManyToManyField(
        "instrumentos.InstrumentoDoCliente",
        through="InstrumentoOS",
        related_name="ordens_servico"
    )
```

### InstrumentoOS Model (Through Model)

Links instruments to OS with type-specific fields:

```python
class InstrumentoOS(models.Model):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE)
    instrumento = models.ForeignKey("instrumentos.InstrumentoDoCliente", on_delete=models.CASCADE)
    item = models.IntegerField(verbose_name="Item")  # Sequence number in OS
    
    # Common fields
    observacao = models.TextField(null=True, blank=True)
    
    # Type-specific fields (nullable, used based on OS type)
    # For Calibração:
    local = models.CharField(max_length=1, choices=Local.choices, null=True, blank=True)
    
    # Computed properties (NOT stored in DB):
    # - tipo_servico: computed from instrumento.instrumento.tipo_de_servico
    # - carga_maxima: computed from instrumento.instrumento.maximo
    # Note: DB fields exist for backward compatibility but are deprecated.
    # Use the @property methods instead.
    
    # For Balanças:
    # These fields ("fabricante", "numero_serie") are computed properties:
    # @property
    # def fabricante(self):
    #     return self.instrumento.instrumento.tipo_de_instrumento.fabricante
    # @property
    # def numero_serie(self):
    #     return self.instrumento.numero_de_serie
    # @property
    # def carga_maxima(self):
    #     return self.instrumento.instrumento.maximo
    # @property
    # def tipo_servico(self):
    #     return self.instrumento.instrumento.tipo_de_servico
    
    marca_reparo = models.BooleanField(default=False, null=True, blank=True)
    marca_selagem_nova = models.BooleanField(default=False, null=True, blank=True)
    marca_selagem_retirada = models.CharField(max_length=255, null=True, blank=True, verbose_name="Marca de selagem retirada")
    servico_executado = models.TextField(null=True, blank=True)
    
    # For Manutenção:
    descricao_anomalia = models.TextField(null=True, blank=True)
    
    # For Serviços Externos:
    quantidade = models.IntegerField(null=True, blank=True)
    
    class Meta:
        unique_together = [['ordem_servico', 'item']]
        ordering = ['item']
```

### Data Model Diagram

```
Proposta
  ├── instrumentos (ManyToMany via PropostaInstrumento)
  └── ordens_servico (ForeignKey)
      └── OrdemServico
          ├── tipo_os (CAL/BAL/MAN/EXT)
          ├── status (AR/EA/RE/CA)
          └── instrumentos (ManyToMany via InstrumentoOS)
              └── InstrumentoOS
                  ├── instrumento (FK)
                  ├── item (sequence)
                  └── type-specific fields
```

## API Changes

### New Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/api/ordens-servico/` | List all OS (filtered by tipo_os, status) | Staff |
| `GET` | `/api/ordens-servico/{id}/` | Get OS detail with instruments | Staff |
| `PATCH` | `/api/ordens-servico/{id}/` | Update OS (status, responsavel, dates) | Gerente |
| `POST` | `/api/ordens-servico/{id}/reallocar/` | Move instrument to another/new OS | Gerente |
| `POST` | `/api/ordens-servico/{id}/gerar-certificado/` | Generate certificate for instrument | Staff |
| `PATCH` | `/api/ordens-servico/{id}/finalizar/` | Mark OS as "realizado" | Gerente |

### Request/Response Examples

#### GET /api/ordens-servico/?tipo_os=CAL&status=AR

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "numero": "0015A26-OS-CAL-001",
      "tipo_os": "CAL",
      "status": "AR",
      "proposta": 15,
      "proposta_numero": "0015A26",
      "cliente_nome": "Empresa ABC",
      "responsavel": 5,
      "data_criacao": "2026-01-08T10:30:00Z",
      "instrumentos_count": 3
    }
  ]
}
```

#### POST /api/ordens-servico/{id}/reallocar/

**Request:**
```json
{
  "instrumento_id": 123,
  "nova_os_id": 456,  // null to create new OS
  "nova_os_tipo": "CAL"  // required if nova_os_id is null
}
```

#### POST /api/ordens-servico/{id}/gerar-certificado/

**Request:**
```json
{
  "instrumento_id": 123
}
```

**Response:**
```json
{
  "numero_certificado": "0015A26-OS-CAL-001-001",
  "instrumento_id": 123
}
```

## Async Task Behavior (Celery)

### Task: `criar_ordens_servico_proposta`

**File**: `ordem_servico/tasks.py`

```python
@shared_task(bind=True, max_retries=3)
def criar_ordens_servico_proposta(self, proposta_id):
    """
    Create OrdemServico records for approved proposal.
    
    Idempotent: checks if OS already exist before creating.
    Retries: 3 times with exponential backoff.
    """
    try:
        proposta = Proposta.objects.select_related('cliente').get(id=proposta_id)
        
        # Idempotency check
        if proposta.ordens_servico.exists():
            logger.info(f"OS already exist for proposta {proposta_id}")
            return {"status": "already_exists", "os_count": proposta.ordens_servico.count()}
        
        # Get instrument selections from proposta
        instrumentos_data = proposta.get_instrumentos_selecoes()  # Returns dict
        
        # Group instruments
        grupos = agrupar_instrumentos_os(instrumentos_data)
        
        # Create OS for each group
        os_created = []
        with transaction.atomic():
            for grupo_key, instrumentos in grupos.items():
                os = criar_os_do_grupo(proposta, grupo_key, instrumentos)
                os_created.append(os.id)
        
        logger.info(f"Created {len(os_created)} OS for proposta {proposta_id}")
        return {"status": "success", "os_ids": os_created}
        
    except Proposta.DoesNotExist:
        logger.error(f"Proposta {proposta_id} not found")
        raise
    except Exception as exc:
        logger.error(f"Error creating OS: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

### Idempotency

- Check if `proposta.ordens_servico.exists()` before creating
- Use database transaction to ensure atomicity
- If OS exist, return early (idempotent)

### Race Conditions

- Use `select_for_update()` when checking/creating OS
- Database constraints (unique numero) prevent duplicates
- Celery task is bound to single worker execution

### Retries

- Max 3 retries
- Exponential backoff: 60s, 120s, 240s
- Log errors for monitoring

## Status Machine for OS

### Status Transitions

```
a_realizar → em_andamento → realizado
     ↓              ↓
  cancelado    cancelado
```

### Rules

1. **a_realizar** → **em_andamento**: Manual (Gerente)
2. **em_andamento** → **realizado**: Manual (Gerente), enables billing release
3. **a_realizar** → **cancelado**: Manual (Gerente)
4. **em_andamento** → **cancelado**: Manual (Gerente)
5. **realizado** → No transitions (final state)
6. **cancelado** → No transitions (final state)

### Implementation

```python
def pode_transicionar_status(self, novo_status):
    """Validate status transition"""
    transitions = {
        StatusOS.A_REALIZAR: [StatusOS.EM_ANDAMENTO, StatusOS.CANCELADO],
        StatusOS.EM_ANDAMENTO: [StatusOS.REALIZADO, StatusOS.CANCELADO],
        StatusOS.REALIZADO: [],
        StatusOS.CANCELADO: [],
    }
    return novo_status in transitions.get(self.status, [])
```

## Grouping Rules

### Grouping Function

```python
def agrupar_instrumentos_os(instrumentos_data):
    """
    Group instruments into OS based on:
    1. If instrument is scale (balança) → OS Balanças
    2. Location (cliente / permanente / terceirizado) - from proposal selection
    3. Service type (acreditado / nao_acreditado) - from instrument.tipo_de_servico
    4. Service kind (calibracao / manutencao) - from proposal selection
    
    Returns: dict with keys like:
    - "BAL-{local}-{tipo_servico}-{service_kind}"
    - "CAL-{local}-{tipo_servico}"
    - "MAN-{local}-{tipo_servico}"
    - "EXT-{local}-{tipo_servico}-{service_kind}"
    """
    grupos = defaultdict(list)
    
    for inst_data in instrumentos_data:
        instrumento = inst_data['instrumento']
        local = inst_data['local']
        # tipo_servico comes from instrumento.instrumento.tipo_de_servico
        tipo_servico = instrumento.instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO
        service_kind = inst_data['service_kind']  # 'calibracao' or 'manutencao'
        
        # Check if scale
        is_balanca = is_instrumento_balanca(instrumento)
        
        if is_balanca:
            tipo_os = "BAL"
        elif local == Local.TERCEIRIZADA:
            tipo_os = "EXT"
        elif service_kind == "calibracao":
            tipo_os = "CAL"
        elif service_kind == "manutencao":
            tipo_os = "MAN"
        else:
            raise ValueError(f"Invalid service_kind: {service_kind}")
        
        # Group key
        if tipo_os == "BAL":
            key = f"{tipo_os}-{local}-{tipo_servico}-{service_kind}"
        else:
            key = f"{tipo_os}-{local}-{tipo_servico}"
        
        grupos[key].append(inst_data)
    
    return grupos

def is_instrumento_balanca(instrumento):
    """Check if instrument is a scale by TipoInstrumento.descricao"""
    # Possibly the field is a description like "balança analítica X", so check for "balanca" in the string (with/without accent)
    descricao = instrumento.instrumento.tipo_de_instrumento.descricao.lower()
    return "balança" in descricao or "balanca" in descricao
```

### Assumptions

1. **Scale detection**: Case-insensitive check for "balança" or "balanca" in `TipoInstrumento.descricao`
2. **Balanças grouping**: Still separated by local + tipo_servico + service_kind (unless all balanças go to same OS - document assumption)
3. **tipo_servico source**: Read from `Instrumento.tipo_de_servico` field, not from proposal selection. If missing, defaults to NAO_ACREDITADO.

## OS Type-Specific Fields

### OS Calibração

**OrdemServico fields:**
- numero, cliente, cnpj (from proposta), proposta, responsavel
- data_recebimento_instrumentos
- data_liberacao_instrumentos

**InstrumentoOS fields (per item):**
- item, descricao (from instrumento), tag, local, tipo_servico (computed), observacao

### OS Balanças

**OrdemServico fields:**
- numero, cliente, cnpj, proposta, responsavel

**InstrumentoOS fields (per item):**
- item, descricao, tag, fabricante, numero_serie, carga_maxima (computed)
- marca_reparo, marca_selagem_nova, marca_selagem_retirada (string), servico_executado, observacao

### OS Manutenção

**OrdemServico fields:**
- numero, cliente, cnpj, proposta, responsavel
- data_liberacao_instrumentos

**InstrumentoOS fields (per item):**
- item, descricao, tag, descricao_anomalia, observacao

### OS Serviços Externos

**OrdemServico fields:**
- numero, cliente, cnpj, proposta, responsavel
- data_calibracao_instrumentos
- data_liberacao_calibracao

**InstrumentoOS fields (per item):**
- item, quantidade, descricao, observacao

## Certificate Generation

### Logic per OS Type

1. **OS Calibração**: Auto-generate calibration number on OS creation
   - Format: `{os_numero}-{item:03d}`
   - Stored in `InstrumentoDoCliente.numero_certificado`
   - No manual button needed

2. **OS Balanças**: Manual generation (button)
   - Format: `{os_numero}-{item:03d}`
   - Uses existing certificate sequence
   - Button: "Gerar Número de Certificado"

3. **OS Manutenção**: Manual generation (button)
   - Format: `{os_numero}-{item:03d}`
   - Uses existing certificate sequence
   - Button: "Gerar Número de Certificado"

4. **OS Serviços Externos**: Manual generation (button)
   - Format: `{os_numero}-{item:03d}`
   - Uses existing certificate sequence
   - Button: "Gerar Número de Certificado"

### Implementation

```python
def gerar_numero_certificado(os, instrumento_os):
    """Generate certificate number for instrument in OS"""
    numero = f"{os.numero}-{instrumento_os.item:03d}"
    
    # Check uniqueness
    if InstrumentoDoCliente.objects.filter(numero_certificado=numero).exists():
        # Handle collision (shouldn't happen with proper sequencing)
        raise ValueError(f"Certificate number {numero} already exists")
    
    instrumento_os.instrumento.numero_certificado = numero
    instrumento_os.instrumento.save(update_fields=['numero_certificado'])
    return numero
```

## Edge Cases

1. **Proposta with no instruments**: Skip OS creation, log warning
2. **Instrument without service selection**: Use defaults (document assumptions)
3. **Duplicate OS numero**: Database constraint prevents, task fails
4. **Scale detection ambiguity**: Use case-insensitive substring match
5. **Mixed locations in same OS**: Not allowed (grouping prevents)
6. **OS with single instrument**: Valid, create OS anyway
7. **Task failure after partial creation**: Transaction rollback, retry creates all
8. **Concurrent approval**: Database constraints prevent duplicates

## Backward Compatibility Strategy

### Existing Proposals

1. **Old proposals (status != "A")**: 
   - Can be updated with new instrument selections
   - On approval, use new grouping logic

2. **Old proposals (status == "A")**:
   - Keep existing OS (if any from V1)
   - No migration needed
   - New OS creation uses V2 logic

3. **Proposta.local field**:
   - Keep for backward compatibility
   - Use as default if per-instrument local not specified
   - Migration: populate per-instrument selections from proposta.local

### Migration Path

1. **Data migration**: 
   - For existing approved proposals without OS: create OS using V1 logic (group by tipo_instrumento)
   - For existing OS: add tipo_os="CAL" (default), status="a_realizar"

2. **Code compatibility**:
   - Support both old and new proposal formats
   - Graceful degradation if instrument selections missing

## Acceptance Criteria

See separate acceptance criteria document.

## Related Documentation

- [Backend Proposal Instrument Service Selection](../proposal/instrument-service-selection/plan.md)
- [Frontend Proposal Instrument Service Selection](../../frontend/proposal/instrument-service-selection/plan.md)
