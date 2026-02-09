# OS V2 Implementation Status

> **Date**: 2025-01-XX  
> **Status**: Backend and Frontend Core Implementation Complete

## ✅ Completed

### Backend

1. **Models Created/Updated**:
   - ✅ `PropostaInstrumento` model created in `propostas/models.py`
   - ✅ `OrdemServico` model updated with `tipo_os`, `status`, and date fields
   - ✅ `InstrumentoOS` through model created
   - ✅ Helper methods added to `Proposta` model

2. **Business Logic**:
   - ✅ OS grouping utilities created in `ordem_servico/utils.py`
   - ✅ Celery task updated in `ordem_servico/tasks.py`
   - ✅ Scale detection logic implemented

3. **API**:
   - ✅ Serializers updated for Proposta and OS
   - ✅ `PropostaInstrumentoSerializer` created
   - ✅ `InstrumentoOSSerializer` created
   - ✅ OS ViewSet updated with new endpoints:
     - `reallocar` - Move instrument to another OS
     - `gerar_certificado` - Generate certificate number
     - `finalizar` - Mark OS as realizado
   - ✅ Proposal approval triggers OS generation
   - ✅ OS generation status endpoint added

### Frontend

1. **Components**:
   - ✅ `InstrumentServiceSelectionTable` component created
   - ✅ `FormCreateProposal` updated to use new component

2. **Hooks**:
   - ✅ `useProposalMutations` updated to send new format
   - ✅ OS generation polling added to approval flow

## ⚠️ Pending (Manual Steps Required)

### Database Migrations

**MUST RUN**:
```bash
cd bef-backend/app
python manage.py makemigrations propostas ordem_servico
python manage.py migrate
```

Expected migrations:
1. `propostas/migrations/XXXX_create_proposta_instrumento.py`
2. `ordem_servico/migrations/XXXX_add_os_v2_fields.py`
3. `ordem_servico/migrations/XXXX_create_instrumento_os.py`

### Admin Registration

**TODO**: Register new models in Django admin:

1. **File**: `propostas/admin.py`
   - Add `PropostaInstrumento` to admin

2. **File**: `ordem_servico/admin.py`
   - Add `InstrumentoOS` to admin
   - Update `OrdemServicoAdmin` to show new fields

### Data Migration

**TODO**: Create data migration for existing proposals:

```python
# Migration: propostas/migrations/XXXX_migrate_existing_proposals.py
def migrate_proposta_local_to_selecoes(apps, schema_editor):
    Proposta = apps.get_model('propostas', 'Proposta')
    PropostaInstrumento = apps.get_model('propostas', 'PropostaInstrumento')
    
    for proposta in Proposta.objects.prefetch_related('instrumentos'):
        if proposta.instrumentos_selecoes.exists():
            continue
        
        for instrumento in proposta.instrumentos.all():
            PropostaInstrumento.objects.get_or_create(
                proposta=proposta,
                instrumento=instrumento,
                defaults={
                    'service_kind': 'calibracao',
                    'local': proposta.local,
                }
            )
```

### URL Configuration

**TODO**: Verify OS URLs are registered:

- Check `rkp_platform/urls.py` includes `ordem_servico.urls`
- Verify proposal URLs include new endpoints

### Frontend OS Management UI

**TODO**: Create/update OS management components:

1. OS List view with filters (tipo_os, status)
2. OS Detail view showing InstrumentoOS fields
3. Reallocation dialog component
4. Certificate generation UI

## 🔍 Testing Checklist

### Backend Tests

- [ ] Test PropostaInstrumento creation
- [ ] Test OS grouping logic
- [ ] Test Celery task execution
- [ ] Test OS reallocation
- [ ] Test certificate generation
- [ ] Test status transitions

### Frontend Tests

- [ ] Test proposal creation with selections
- [ ] Test instrument selection table
- [ ] Test OS generation polling
- [ ] Test form validation

### Integration Tests

- [ ] Test proposal creation → approval → OS generation flow
- [ ] Test backward compatibility with old proposals

## 📝 Notes

1. **Backward Compatibility**: Code handles old proposals without selections by using defaults
2. **Scale Detection**: Uses case-insensitive substring match for "balança" in TipoInstrumento.descricao
3. **Certificate Generation**: Auto-generated for calibration OS, manual for others
4. **Status Transitions**: Validated in model method `pode_transicionar_status()`

## 🚀 Next Steps

1. Run migrations
2. Register models in admin
3. Create data migration for existing proposals
4. Test on staging environment
5. Implement remaining frontend OS management UI
6. Full integration testing
