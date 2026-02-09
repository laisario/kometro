# Proposal Instrument Service Selection - Backend

> **Status**: Planning  
> **Date**: 2025-01-XX  
> **Related**: [OS V2 Plan](../../os/create-on-approval/plan.v2.md), [Frontend Plan](../../../frontend/proposal/instrument-service-selection/plan.md)

## Overview

This feature enables per-instrument service selection during proposal creation. Instead of a single `local` field for all instruments, users can now specify for each instrument:
- Service type: `calibracao` OR `manutencao`
- Location: `cliente` OR `instalacoes_permanentes` OR `terceirizado`

Note: Service accreditation (`tipo_servico`) is already determined when creating the instrument (stored in `Instrumento.tipo_de_servico`) and does not need to be set again during proposal creation.

These selections are stored and later used to generate Service Orders (OS) with proper grouping.

## Feature Summary

- **Proposal Creation**: Collect per-instrument service selections
- **Data Storage**: Store selections in normalized table `PropostaInstrumento`
- **Validation**: Ensure all required fields are provided
- **Backward Compatibility**: Support old proposals with single `local` field
- **OS Generation**: Use selections to group instruments into OS

## Scope

### What Changes

1. **New Model**: `PropostaInstrumento` - Stores per-instrument selections
2. **Proposta Model**: 
   - Keep `local` field for backward compatibility
   - Add helper methods to access instrument selections
3. **API**: Update proposal creation/update endpoints to accept new format
4. **Validation**: Ensure selections are valid and complete

### Non-Goals

- Removing `Proposta.local` field (kept for compatibility)
- Bulk selection updates (one instrument at a time)
- Default selections based on instrument type

## Data Model Changes

### New Model: PropostaInstrumento

```python
class PropostaInstrumento(models.Model):
    """
    Stores per-instrument service selections for a proposal.
    Replaces the single Proposta.local field with per-instrument granularity.
    """
    proposta = models.ForeignKey(
        "propostas.Proposta",
        on_delete=models.CASCADE,
        related_name="instrumentos_selecoes"
    )
    instrumento = models.ForeignKey(
        "instrumentos.InstrumentoDoCliente",
        on_delete=models.CASCADE,
        related_name="propostas_selecoes"
    )
    
    # Service selection fields
    service_kind = models.CharField(
        max_length=20,
        choices=[
            ("calibracao", _("Calibração")),
            ("manutencao", _("Manutenção")),
        ],
        verbose_name="Tipo de serviço"
    )
    local = models.CharField(
        max_length=1,
        choices=Local.choices,
        verbose_name="Local"
    )
    # Note: tipo_servico (acreditado/nao_acreditado) is stored in Instrumento.tipo_de_servico
    # and does not need to be stored here. It will be read from the instrument during OS generation.
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['proposta', 'instrumento']]
        verbose_name = "Seleção de Serviço do Instrumento"
        verbose_name_plural = "Seleções de Serviço dos Instrumentos"
```

### Proposta Model Updates

```python
class Proposta(models.Model):
    # ... existing fields ...
    local = models.CharField(...)  # Kept for backward compatibility
    
    def get_instrumentos_selecoes(self):
        """
        Returns dict of instrument selections:
        {
            instrumento_id: {
                'instrumento': InstrumentoDoCliente instance,
                'service_kind': 'calibracao' | 'manutencao',
                'local': 'C' | 'P' | 'T',
                'tipo_servico': 'A' | 'NA'  # Read from instrumento.instrumento.tipo_de_servico
            }
        }
        """
        selecoes = self.instrumentos_selecoes.select_related(
            'instrumento__instrumento__tipo_de_instrumento'
        ).all()
        
        return {
            sel.instrumento_id: {
                'instrumento': sel.instrumento,
                'service_kind': sel.service_kind,
                'local': sel.local,
                'tipo_servico': sel.instrumento.instrumento.tipo_de_servico,  # From instrument
            }
            for sel in selecoes
        }
    
    def get_instrumento_selecao(self, instrumento_id):
        """Get selection for specific instrument"""
        try:
            sel = self.instrumentos_selecoes.select_related(
                'instrumento__instrumento'
            ).get(instrumento_id=instrumento_id)
            return {
                'service_kind': sel.service_kind,
                'local': sel.local,
                'tipo_servico': sel.instrumento.instrumento.tipo_de_servico,  # From instrument
            }
        except PropostaInstrumento.DoesNotExist:
            # Fallback to proposta.local for backward compatibility
            instrumento = self.instrumentos.get(id=instrumento_id)
            return {
                'service_kind': 'calibracao',  # Default assumption
                'local': self.local,
                'tipo_servico': instrumento.instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO,  # From instrument
            }
```

### Data Model Diagram

```
Proposta
  ├── local (CharField) - backward compatibility
  ├── instrumentos (ManyToMany)
  └── instrumentos_selecoes (ForeignKey)
      └── PropostaInstrumento
          ├── proposta (FK)
          ├── instrumento (FK)
          ├── service_kind (calibracao/manutencao)
          └── local (C/P/T)
          # tipo_servico comes from instrumento.instrumento.tipo_de_servico
```

## API Changes

### Proposal Creation Endpoint

**Endpoint**: `POST /api/propostas/`

**Request Body (New Format)**:
```json
{
  "cliente": 123,
  "informacoes_adicionais": "Additional info",
  "instrumentos": [
    {
      "id": 456,
      "service_kind": "calibracao",
      "local": "C"
    },
    {
      "id": 789,
      "service_kind": "manutencao",
      "local": "P"
    }
  ]
}
```

**Request Body (Backward Compatible Format)**:
```json
{
  "cliente": 123,
  "local": "P",  // Applied to all instruments if selections not provided
  "instrumentos": [456, 789]  // Simple list of IDs
}
```

### Proposal Update Endpoint

**Endpoint**: `PATCH /api/propostas/{id}/`

**Request Body**:
```json
{
  "instrumentos": [
    {
      "id": 456,
      "service_kind": "calibracao",
      "local": "C"
    }
  ]
}
```

### Response Format

**GET /api/propostas/{id}/**

```json
{
  "id": 15,
  "numero": "0015A26",
  "cliente": 123,
  "status": "E",
  "local": "P",  // Backward compatibility
  "instrumentos": [456, 789],
  "instrumentos_selecoes": [
    {
      "instrumento": 456,
      "service_kind": "calibracao",
      "local": "C",
      "tipo_servico": "A"  // Read from instrumento.instrumento.tipo_de_servico
    },
    {
      "instrumento": 789,
      "service_kind": "manutencao",
      "local": "P",
      "tipo_servico": "NA"  // Read from instrumento.instrumento.tipo_de_servico
    }
  ]
}
```

## Validation Rules

### Required Fields

1. **On proposal creation with instrument selections**:
   - `instrumento.id`: Required
   - `service_kind`: Required, must be "calibracao" or "manutencao"
   - `local`: Required, must be valid Local choice
   - Note: `tipo_servico` is read from the instrument itself (`instrumento.instrumento.tipo_de_servico`), not from the proposal selection

2. **On proposal update**:
   - If updating instrument selections, all fields required
   - Can add/remove instruments

### Business Rules

1. **Instrument must belong to proposal client**: Validate `instrumento.cliente == proposta.cliente`
2. **No duplicate instruments**: Each instrument can only appear once in proposal
3. **Backward compatibility**: If `instrumentos` is simple list (IDs only), use `proposta.local` as default

### Validation Implementation

```python
class PropostaInstrumentoSerializer(serializers.ModelSerializer):
    instrumento = serializers.PrimaryKeyRelatedField(
        queryset=InstrumentoDoCliente.objects.all()
    )
    
    def validate(self, data):
        proposta = self.context['proposta']
        instrumento = data['instrumento']
        
        # Validate instrument belongs to proposal client
        if instrumento.cliente != proposta.cliente:
            raise serializers.ValidationError(
                "Instrumento must belong to proposal client"
            )
        
        # Validate service_kind
        if data['service_kind'] not in ['calibracao', 'manutencao']:
            raise serializers.ValidationError(
                "service_kind must be 'calibracao' or 'manutencao'"
            )
        
        return data
```

## Backward Compatibility

### Migration Strategy

1. **Existing proposals**: 
   - Keep `Proposta.local` field
   - On first access, create `PropostaInstrumento` records from `proposta.local`
   - Use lazy migration (create on-demand)

2. **API compatibility**:
   - Accept both old format (simple instrument IDs) and new format (with selections)
   - Default to `proposta.local` if selections not provided

3. **Data migration script**:
```python
def migrate_proposta_local_to_selecoes():
    """Migrate existing proposals to use PropostaInstrumento"""
    propostas = Proposta.objects.filter(
        status__in=['A', 'AA', 'E']  # Approved, awaiting, or in elaboration
    ).prefetch_related('instrumentos')
    
    for proposta in propostas:
        if proposta.instrumentos_selecoes.exists():
            continue  # Already migrated
        
        # Create selections from proposta.local
        for instrumento in proposta.instrumentos.all():
            PropostaInstrumento.objects.create(
                proposta=proposta,
                instrumento=instrumento,
                service_kind='calibracao',  # Default assumption
                local=proposta.local,
                # tipo_servico comes from instrumento.instrumento.tipo_de_servico
            )
```

## Integration with OS Generation

The `Proposta.get_instrumentos_selecoes()` method is used by the OS generation task:

```python
# In ordem_servico/tasks.py
instrumentos_data = proposta.get_instrumentos_selecoes()
grupos = agrupar_instrumentos_os(instrumentos_data)
```

See [OS V2 Plan](../../os/create-on-approval/plan.v2.md) for grouping logic.

## Edge Cases

1. **Proposal with no instruments**: Valid, no selections needed
2. **Instrument removed from proposal**: Delete corresponding `PropostaInstrumento`
3. **Duplicate instrument in request**: Use last one, log warning
4. **Missing selection for instrument**: Use defaults (proposta.local, calibracao)
5. **Invalid local values**: Return 400 with validation errors
6. **Missing tipo_servico on instrument**: Use default (NAO_ACREDITADO) during OS generation

## Acceptance Criteria

See separate acceptance criteria document.

## Related Documentation

- [OS V2 Plan](../../os/create-on-approval/plan.v2.md)
- [Frontend Proposal Instrument Service Selection](../../../frontend/proposal/instrument-service-selection/plan.md)
