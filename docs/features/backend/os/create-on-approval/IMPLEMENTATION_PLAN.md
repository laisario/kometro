# Implementation Plan: OS V2 + Proposal Service Selection

> **Date**: 2025-01-XX  
> **Status**: Planning  
> **Related Docs**: 
> - [OS V2 Plan](./plan.v2.md)
> - [Backend Proposal Plan](../proposal/instrument-service-selection/plan.md)
> - [Frontend Proposal Plan](../../../frontend/proposal/instrument-service-selection/plan.md)

## Overview

This document provides a step-by-step implementation plan for:
1. Backend: Proposal instrument service selection
2. Backend: OS V2 with new grouping logic and types
3. Frontend: Proposal creation/editing with service selection
4. Frontend: OS management and certificate generation

## Implementation Strategy

**Phased Approach**:
1. **Phase 1**: Backend data models and migrations
2. **Phase 2**: Backend API and business logic
3. **Phase 3**: Frontend proposal forms
4. **Phase 4**: Frontend OS management
5. **Phase 5**: Testing and rollout

**Incremental Rollout**:
- Feature flag: `ENABLE_OS_V2` (default: False)
- Gradual migration of existing proposals
- Backward compatibility maintained throughout

## Phase 1: Backend Data Models and Migrations

### Step 1.1: Create PropostaInstrumento Model

**File**: `bef-backend/app/propostas/models.py`

```python
class PropostaInstrumento(models.Model):
    proposta = models.ForeignKey(Proposta, ...)
    instrumento = models.ForeignKey("instrumentos.InstrumentoDoCliente", ...)
    service_kind = models.CharField(...)
    local = models.CharField(...)
    # tipo_servico comes from instrumento.instrumento.tipo_de_servico, not stored here
    # ... (see plan.v2.md for full definition)
```

**Migration**: `0001_create_proposta_instrumento.py`

**Actions**:
- [ ] Create model class
- [ ] Add Meta class with unique_together
- [ ] Create migration
- [ ] Test migration on dev database

### Step 1.2: Update OrdemServico Model

**File**: `bef-backend/app/ordem_servico/models.py`

**Changes**:
- Add `tipo_os` field (CharField with choices)
- Add `status` field (CharField with choices, default="AR")
- Add type-specific date fields (nullable)
- Change `instrumentos` ManyToMany to use `through="InstrumentoOS"`

**Migration**: `0002_add_os_v2_fields.py`

**Actions**:
- [ ] Add TipoOS and StatusOS choices
- [ ] Add fields to OrdemServico
- [ ] Create migration
- [ ] Test migration

### Step 1.3: Create InstrumentoOS Model

**File**: `bef-backend/app/ordem_servico/models.py`

**Changes**:
- Create InstrumentoOS model (through model)
- Add all type-specific fields (nullable)

**Migration**: `0003_create_instrumento_os.py`

**Actions**:
- [ ] Create model
- [ ] Add all fields
- [ ] Create migration
- [ ] Test migration

### Step 1.4: Data Migration for Existing Proposals

**Migration**: `0004_migrate_existing_proposals.py`

**Actions**:
- [ ] Create data migration script
- [ ] Migrate existing proposals to PropostaInstrumento
- [ ] Migrate existing OS to new structure
- [ ] Test on staging data

**Migration Script Outline**:
```python
def migrate_proposta_local_to_selecoes(apps, schema_editor):
    Proposta = apps.get_model('propostas', 'Proposta')
    PropostaInstrumento = apps.get_model('propostas', 'PropostaInstrumento')
    
    for proposta in Proposta.objects.prefetch_related('instrumentos'):
        for instrumento in proposta.instrumentos.all():
            PropostaInstrumento.objects.get_or_create(
                proposta=proposta,
                instrumento=instrumento,
                defaults={
                    'service_kind': 'calibracao',
                    'local': proposta.local,
                    # tipo_servico comes from instrumento.instrumento.tipo_de_servico
                }
            )
```

## Phase 2: Backend API and Business Logic

### Step 2.1: Update Proposta Serializers

**File**: `bef-backend/app/propostas/serializers.py`

**Changes**:
- Create `PropostaInstrumentoSerializer`
- Update `PropostaSerializer` to handle new format
- Add validation for instrument selections

**Actions**:
- [ ] Create PropostaInstrumentoSerializer
- [ ] Update PropostaSerializer.write()
- [ ] Add validation methods
- [ ] Test serialization/deserialization

### Step 2.2: Update Proposta ViewSet

**File**: `bef-backend/app/propostas/views.py`

**Changes**:
- Update `create()` to handle new payload format
- Update `update()` to handle instrument selections
- Add backward compatibility logic

**Actions**:
- [ ] Update create method
- [ ] Update update method
- [ ] Add helper methods for backward compatibility
- [ ] Test API endpoints

### Step 2.3: Create OS Grouping Logic

**File**: `bef-backend/app/ordem_servico/utils.py` (new file)

**Functions**:
- `agrupar_instrumentos_os(instrumentos_data)`
- `is_instrumento_balanca(instrumento)`
- `criar_os_do_grupo(proposta, grupo_key, instrumentos)`

**Actions**:
- [ ] Create utils.py
- [ ] Implement grouping function
- [ ] Implement scale detection
- [ ] Write unit tests

### Step 2.4: Update Celery Task

**File**: `bef-backend/app/ordem_servico/tasks.py`

**Changes**:
- Update `criar_ordens_servico_proposta` task
- Use new grouping logic
- Create InstrumentoOS records
- Generate certificate numbers per OS type

**Actions**:
- [ ] Update task function
- [ ] Add idempotency checks
- [ ] Add error handling
- [ ] Test task execution

### Step 2.5: Create OS Serializers

**File**: `bef-backend/app/ordem_servico/serializers.py`

**Changes**:
- Update `OrdemServicoSerializer` with new fields
- Create `InstrumentoOSSerializer`
- Add type-specific serializers if needed

**Actions**:
- [ ] Update OrdemServicoSerializer
- [ ] Create InstrumentoOSSerializer
- [ ] Test serialization

### Step 2.6: Update OS ViewSet

**File**: `bef-backend/app/ordem_servico/views.py`

**New Actions**:
- `reallocar()` - Move instrument to another OS
- `gerar_certificado()` - Generate certificate number
- `finalizar()` - Mark OS as "realizado"

**Actions**:
- [ ] Add reallocar action
- [ ] Add gerar_certificado action
- [ ] Add finalizar action
- [ ] Update list/retrieve to include new fields
- [ ] Test all endpoints

### Step 2.7: Update Proposal Approval Trigger

**File**: `bef-backend/app/propostas/views.py`

**Changes**:
- Update `aprovar()` action to trigger OS generation task
- Add status check endpoint for frontend polling

**Actions**:
- [ ] Update aprovar action
- [ ] Add status check endpoint
- [ ] Test approval flow

## Phase 3: Frontend Proposal Forms

### Step 3.1: Create InstrumentServiceSelectionTable Component

**File**: `frontend/src/proposals/components/InstrumentServiceSelectionTable.jsx`

**Actions**:
- [ ] Create component structure
- [ ] Implement table UI
- [ ] Add form state management
- [ ] Add validation
- [ ] Style with Material-UI

### Step 3.2: Create InstrumentServiceSelectionRow Component

**File**: `frontend/src/proposals/components/InstrumentServiceSelectionRow.jsx`

**Actions**:
- [ ] Create row component
- [ ] Add service kind radio buttons
- [ ] Add location select
- [ ] Display tipo_servico from instrument (read-only)
- [ ] Add remove button

### Step 3.3: Update FormCreateProposal

**File**: `frontend/src/proposals/components/FormCreateProposal.jsx`

**Changes**:
- Add InstrumentServiceSelectionTable
- Update form state structure
- Update submit handler

**Actions**:
- [ ] Import new components
- [ ] Update form default values
- [ ] Update submit handler
- [ ] Add validation
- [ ] Test form submission

### Step 3.4: Update Proposal Mutations

**File**: `frontend/src/proposals/hooks/useProposalMutations.js`

**Changes**:
- Update `createProposal` to send new format
- Update `updateProposal` to handle selections

**Actions**:
- [ ] Update createProposal function
- [ ] Update updateProposal function
- [ ] Test API calls

### Step 3.5: Update FormAddInstrument

**File**: `frontend/src/proposals/components/FormAddInstrument.jsx`

**Changes**:
- Add service selection when adding instruments

**Actions**:
- [ ] Add selection fields
- [ ] Update submit handler
- [ ] Test adding instruments

### Step 3.6: Add OS Generation Progress Component

**File**: `frontend/src/proposals/components/OSGenerationProgress.jsx`

**Actions**:
- [ ] Create loading component
- [ ] Add polling logic
- [ ] Add timeout handling
- [ ] Style with Material-UI

### Step 3.7: Update Proposal Approval Flow

**File**: `frontend/src/proposals/hooks/useProposalMutations.js`

**Changes**:
- Update approval mutation to show progress
- Add polling for OS generation status

**Actions**:
- [ ] Update approve mutation
- [ ] Add polling logic
- [ ] Test approval flow

## Phase 4: Frontend OS Management

### Step 4.1: Update OS List View

**File**: `frontend/src/ordem-servico/components/OSList.jsx` (or similar)

**Changes**:
- Add filters for tipo_os and status
- Display new fields

**Actions**:
- [ ] Add tipo_os filter
- [ ] Add status filter
- [ ] Update table columns
- [ ] Test filtering

### Step 4.2: Create OS Detail View

**File**: `frontend/src/ordem-servico/components/OSDetail.jsx`

**Changes**:
- Display OS with instruments
- Show type-specific fields
- Add certificate generation buttons

**Actions**:
- [ ] Create detail view
- [ ] Display instruments with InstrumentoOS fields
- [ ] Add certificate generation UI
- [ ] Test detail view

### Step 4.3: Create Instrument Reallocation Dialog

**File**: `frontend/src/ordem-servico/components/ReallocateInstrumentDialog.jsx`

**Actions**:
- [ ] Create dialog component
- [ ] Add OS selection
- [ ] Add "create new OS" option
- [ ] Implement reallocation API call
- [ ] Test reallocation

### Step 4.4: Add Certificate Generation UI

**File**: `frontend/src/ordem-servico/components/CertificateGeneration.jsx`

**Changes**:
- Show certificate generation button (if not calibration OS)
- Auto-generate for calibration OS
- Display generated certificate numbers

**Actions**:
- [ ] Create certificate generation component
- [ ] Add button logic
- [ ] Display certificate numbers
- [ ] Test generation

## Phase 5: Testing and Rollout

### Step 5.1: Unit Tests

**Backend**:
- [ ] Test PropostaInstrumento model
- [ ] Test OS grouping logic
- [ ] Test Celery task
- [ ] Test serializers
- [ ] Test views

**Frontend**:
- [ ] Test form components
- [ ] Test mutations
- [ ] Test validation

### Step 5.2: Integration Tests

- [ ] Test proposal creation → OS generation flow
- [ ] Test OS reallocation
- [ ] Test certificate generation
- [ ] Test backward compatibility

### Step 5.3: E2E Tests

- [ ] Create proposal with selections
- [ ] Approve proposal
- [ ] Verify OS generation
- [ ] Reallocate instrument
- [ ] Generate certificate

### Step 5.4: Migration Testing

- [ ] Test data migration on staging
- [ ] Verify existing proposals work
- [ ] Verify existing OS work

### Step 5.5: Rollout Plan

1. **Week 1**: Deploy to staging, test with real data
2. **Week 2**: Deploy to production with feature flag OFF
3. **Week 3**: Enable feature flag for 10% of users
4. **Week 4**: Enable feature flag for 50% of users
5. **Week 5**: Enable feature flag for all users
6. **Week 6**: Remove feature flag, remove backward compatibility code (optional)

## Database Migration Checklist

- [ ] Create PropostaInstrumento table
- [ ] Add tipo_os to OrdemServico
- [ ] Add status to OrdemServico
- [ ] Add type-specific date fields to OrdemServico
- [ ] Create InstrumentoOS table
- [ ] Migrate existing PropostaInstrumento data
- [ ] Migrate existing OrdemServico data
- [ ] Add indexes for performance
- [ ] Verify foreign key constraints

## API Endpoint Checklist

**Proposal Endpoints**:
- [ ] POST /api/propostas/ (updated)
- [ ] PATCH /api/propostas/{id}/ (updated)
- [ ] GET /api/propostas/{id}/ (includes selecoes)
- [ ] GET /api/propostas/{id}/ordens-servico/status/ (new)

**OS Endpoints**:
- [ ] GET /api/ordens-servico/ (updated filters)
- [ ] GET /api/ordens-servico/{id}/ (updated fields)
- [ ] PATCH /api/ordens-servico/{id}/ (updated)
- [ ] POST /api/ordens-servico/{id}/reallocar/ (new)
- [ ] POST /api/ordens-servico/{id}/gerar-certificado/ (new)
- [ ] PATCH /api/ordens-servico/{id}/finalizar/ (new)

## Frontend Component Checklist

- [ ] InstrumentServiceSelectionTable
- [ ] InstrumentServiceSelectionRow
- [ ] OSGenerationProgress
- [ ] Updated FormCreateProposal
- [ ] Updated FormAddInstrument
- [ ] Updated OS List
- [ ] OS Detail View
- [ ] ReallocateInstrumentDialog
- [ ] CertificateGeneration

## Rollback Plan

If issues arise:

1. **Feature Flag**: Disable `ENABLE_OS_V2` flag
2. **Database**: Keep new tables (no data loss)
3. **Code**: Revert to previous version
4. **Migration**: Old proposals continue to work

## Assumptions and Decisions

1. **Scale Detection**: Case-insensitive substring match for "balança" in TipoInstrumento.descricao
2. **Balanças Grouping**: Still separated by local + tipo_servico + service_kind
3. **tipo_servico Source**: Read from Instrumento.tipo_de_servico, not from proposal selection
4. **Default Values**: calibracao, permanente (tipo_servico from instrument, defaults to NAO_ACREDITADO if missing)
5. **Backward Compatibility**: Maintained for at least 3 months

## Timeline Estimate

- **Phase 1**: 3-4 days
- **Phase 2**: 5-6 days
- **Phase 3**: 4-5 days
- **Phase 4**: 3-4 days
- **Phase 5**: 3-4 days

**Total**: ~18-23 days (3.5-4.5 weeks)

## Dependencies

- Django 3.2+
- DRF 3.12+
- Celery 5.0+
- React 18+
- Material-UI 5+

## Risk Mitigation

1. **Data Loss**: Full database backup before migration
2. **Performance**: Add database indexes
3. **Race Conditions**: Use select_for_update() and transactions
4. **Task Failures**: Implement retries and monitoring
5. **UI Complexity**: Progressive enhancement, clear validation messages
