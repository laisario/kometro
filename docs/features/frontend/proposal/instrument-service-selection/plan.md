# Proposal Instrument Service Selection - Frontend

> **Status**: Planning  
> **Date**: 2025-01-XX  
> **Related**: [Backend Plan](../../backend/proposal/instrument-service-selection/plan.md), [OS V2 Plan](../../backend/os/create-on-approval/plan.v2.md)

## Overview

This feature updates the proposal creation and editing UI to collect per-instrument service selections. Users must specify for each selected instrument:
- Service type: Calibração OR Manutenção
- Location: Cliente OR Instalações Permanentes OR Terceirizado

Note: Service accreditation (Acreditado/Não Acreditado) is already determined when creating the instrument and does not need to be selected again. It will be read from the instrument data during OS generation.

The UI must be intuitive, validate inputs, and send data in the format expected by the backend API.

## Feature Summary

- **Proposal Creation Form**: Add per-instrument selection UI
- **Instrument Selection Table**: Display selected instruments with service options
- **Validation**: Client-side validation before submission
- **Loading States**: Show progress during OS generation after approval
- **Backward Compatibility**: Support old proposals without selections

## Scope

### What Changes

1. **FormCreateProposal Component**: Add instrument service selection UI
2. **Proposal Detail View**: Display and edit instrument selections
3. **FormAddInstrument Component**: Include service selection when adding instruments
4. **Proposal Approval Flow**: Show loading state during OS generation
5. **API Integration**: Update mutation hooks to send new format

### Non-Goals

- Bulk selection (select same values for multiple instruments at once)
- Selection templates or presets
- Advanced filtering of instruments based on service type

## UI Changes

### Proposal Creation Form

**Current Flow**:
1. Select client (admin only)
2. Select instruments (autocomplete)
3. Add additional info
4. Submit

**New Flow**:
1. Select client (admin only)
2. Select instruments (autocomplete)
3. **For each selected instrument, configure**:
   - Service type (Calibração / Manutenção) - Radio buttons or Select
   - Location (Cliente / Instalações Permanentes / Terceirizado) - Select
4. Add additional info
5. Submit

### Component Structure

```
FormCreateProposal
  ├── Client Selection (admin only)
  ├── Instrument Autocomplete
  ├── InstrumentServiceSelectionTable (NEW)
  │   ├── InstrumentServiceSelectionRow (per instrument)
  │   │   ├── Instrument Info (read-only, shows tipo_servico if available)
  │   │   ├── Service Kind Select (calibracao/manutencao)
  │   │   └── Location Select (C/P/T)
  │   └── Validation messages
  └── Additional Info TextField
```

### InstrumentServiceSelectionTable Component

**Props**:
```javascript
/**
 * @param {Object} props
 * @param {Array<Object>} props.instruments - Array of InstrumentoDoCliente objects
 * @param {Map<number, Object>} props.selections - Map of instrumentId to selection object
 * @param {Function} props.onChange - Callback when selection changes
 *   @param {number} instrumentId
 *   @param {Object} selection - { service_kind: 'calibracao'|'manutencao', local: 'C'|'P'|'T' }
 * @param {Map<number, Array<string>>} [props.errors] - Map of instrumentId to error messages
 */

// Selection object structure:
// {
//   service_kind: 'calibracao' | 'manutencao',
//   local: 'C' | 'P' | 'T'
//   // tipo_servico comes from instrumento.instrumento.tipo_de_servico, not from form
// }
```

**UI Design**:
- Table with columns: Instrument (Tag/Serial, shows tipo_servico if available), Service Type, Location, Actions
- Each row is editable inline
- Validation errors shown below each row
- Remove instrument button per row

### Form State Management

**React Hook Form Structure**:
```javascript
// Form data structure:
// {
//   cliente: { id: number, empresa: string, ... } | null,
//   informacoesAdicionais: string | null,
//   instrumentos: [
//     {
//       id: number,
//       service_kind: 'calibracao' | 'manutencao',
//       local: 'C' | 'P' | 'T'
//       // tipo_servico comes from instrumento.instrumento.tipo_de_servico, not from form
//     },
//     ...
//   ]
// }
```

**Default Values**:
- `service_kind`: 'calibracao'
- `local`: 'P' (Instalações Permanentes)
- `tipo_servico`: Read from instrumento.instrumento.tipo_de_servico (display only)

### Validation

**Client-Side Validation**:
1. At least one instrument required
2. All selected instruments must have complete selections
3. Service kind must be 'calibracao' or 'manutencao'
4. Local must be valid choice

**Validation Messages**:
- "Selecione o tipo de serviço para todos os instrumentos"
- "Selecione o local para todos os instrumentos"

## API Integration

### Proposal Creation Mutation

**File**: `frontend/src/proposals/hooks/useProposalMutations.js`

**Current Implementation**:
```javascript
const createProposal = async (data) => {
  await axios.post('/propostas/', { 
    instrumentos: data?.instrumentos?.length ? data?.instrumentos?.map(instrumento => instrumento?.id) : null, 
    cliente: data?.cliente?.id ? data?.cliente?.id : null, 
    informacoesAdicionais: data?.informacoesAdicionais
  });
}
```

**New Implementation**:
```javascript
const createProposal = async (data) => {
  const payload = {
    cliente: data?.cliente?.id ? data?.cliente?.id : null,
    informacoes_adicionais: data?.informacoesAdicionais,
    instrumentos: data?.instrumentos?.map(inst => ({
      id: inst.id,
      service_kind: inst.service_kind,
      local: inst.local,
      // tipo_servico comes from instrumento.instrumento.tipo_de_servico on backend
    }))
  };
  
  await axios.post('/propostas/', payload);
}
```

### Proposal Update Mutation

**Similar changes** for updating instrument selections.

## Proposal Approval Flow

### Loading State During OS Generation

**Current**: Approval action completes immediately.

**New**: After approval, show loading indicator while OS are being generated.

**UI State Diagram**:
```
[Proposal Approved] 
  → [Show Loading Indicator]
  → [Poll /api/propostas/{id}/ordens-servico/status/]
  → [OS Generation Complete]
  → [Show Success Message]
  → [Navigate to OS List or Proposal Detail]
```

**Implementation**:
```javascript
const handleApprove = async () => {
  await mutateApproveProposal(propostaId);
  
  // Start polling for OS generation status
  const pollInterval = setInterval(async () => {
    const status = await checkOSGenerationStatus(propostaId);
    if (status === 'complete') {
      clearInterval(pollInterval);
      // Show success, navigate
    }
  }, 2000); // Poll every 2 seconds
  
  // Timeout after 60 seconds
  setTimeout(() => {
    clearInterval(pollInterval);
    // Show timeout message
  }, 60000);
};
```

### New Endpoint for Status Check

**GET /api/propostas/{id}/ordens-servico/status/**

**Response**:
```json
{
  "status": "generating" | "complete" | "error",
  "os_count": 5,
  "message": "Ordens de serviço sendo geradas..."
}
```

## Backward Compatibility

### Handling Old Proposals

1. **Display**: If proposal has no `instrumentos_selecoes`, show default values:
   - Service: Calibração
   - Location: From `proposta.local`
   - Tipo Serviço: Read from instrument (display only)

2. **Editing**: Allow adding selections to old proposals
3. **API**: Send backward-compatible format if selections incomplete

## Component Files

### New Components

1. **`InstrumentServiceSelectionTable.jsx`**
   - Location: `frontend/src/proposals/components/InstrumentServiceSelectionTable.jsx`
   - Purpose: Display and edit instrument service selections

2. **`InstrumentServiceSelectionRow.jsx`**
   - Location: `frontend/src/proposals/components/InstrumentServiceSelectionRow.jsx`
   - Purpose: Single row for instrument selection

3. **`OSGenerationProgress.jsx`**
   - Location: `frontend/src/proposals/components/OSGenerationProgress.jsx`
   - Purpose: Loading indicator during OS generation

### Modified Components

1. **`FormCreateProposal.jsx`**
   - Add InstrumentServiceSelectionTable
   - Update form state structure
   - Update submit handler

2. **`FormAddInstrument.jsx`**
   - Add service selection fields when adding instruments

3. **`useProposalMutations.js`**
   - Update create/update mutations to send new format

4. **Proposal Detail View**
   - Display instrument selections
   - Allow editing selections (if proposal not approved)

## UI Mockup (Text Description)

```
┌─────────────────────────────────────────────────────────┐
│ Criar novo pedido de calibração                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Cliente: [Autocomplete]                                 │
│                                                         │
│ Instrumentos: [Autocomplete - multi-select]            │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Instrumentos Selecionados                           ││
│ ├──────┬──────────┬──────────┬─────────────┤│
│ │ Tag  │ Serviço  │ Local    │ Ações       ││
│ ├──────┼──────────┼──────────┼─────────────┤│
│ │ BA-1 │ ○ Calib. │ [Select] │ [Remove]    ││
│ │(A)   │ ● Manut. │          │             ││
│ ├──────┼──────────┼──────────┼─────────────┤│
│ │ TM-2 │ ○ Calib. │ [Select] │ [Remove]    ││
│ │(NA)  │ ● Manut. │          │             ││
│       (tipo_servico shown in instrument info)
│ └──────┴──────────┴──────────┴──────────┴─────────────┘│
│                                                         │
│ Informações adicionais: [TextArea]                     │
│                                                         │
│ [Cancelar]                    [Enviar proposta]        │
└─────────────────────────────────────────────────────────┘
```

## Validation Rules

### Required Fields

- All selected instruments must have:
  - `service_kind` selected
  - `local` selected
  - Note: `tipo_servico` is read from the instrument data, not from form selection

### Business Rules

- Cannot submit proposal without at least one instrument
- Cannot submit proposal with incomplete selections
- Show validation errors inline per instrument row

## Error Handling

### API Errors

- **400 Bad Request**: Show validation errors per field
- **500 Server Error**: Show generic error message
- **Network Error**: Show retry option

### User Feedback

- Success: "Proposta criada com sucesso!"
- Error: "Erro ao criar proposta. Verifique os campos e tente novamente."
- OS Generation: "Gerando ordens de serviço... Aguarde."

## Acceptance Criteria

See separate acceptance criteria document.

## Related Documentation

- [Backend Proposal Instrument Service Selection](../../backend/proposal/instrument-service-selection/plan.md)
- [OS V2 Plan](../../backend/os/create-on-approval/plan.v2.md)
