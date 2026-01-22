# Feature: Elaborate Proposal

## Feature Summary

Multi-step form for finalizing a draft proposal: selecting instruments, setting terms, and generating PDF.

## User Value

### Problem Solved
Draft proposals need to be finalized with complete information before sending to clients.

### Who Benefits
- **Commercial Managers**: Complete proposals for sending

## Scope

### In Scope
- Instrument selection from client inventory
- Payment terms entry
- Validity date setting
- Discount application
- Business days estimate
- Additional notes
- PDF generation

### Out of Scope
- Custom pricing per instrument
- Multi-currency

## User Flow

### Primary Flow
1. Staff opens draft proposal
2. Staff clicks "Elaborate"
3. Staff selects instruments
4. Staff fills terms and conditions
5. System calculates total
6. Staff confirms elaboration
7. PDF generated, status changes

## Acceptance Criteria

- [ ] Instrument autocomplete from client inventory
- [ ] Price calculation based on location
- [ ] Discount percentage applied
- [ ] PDF generated on confirm
- [ ] Status changes to Awaiting Approval

## Frontend Behavior

### Screens/Components
- `FormElaborate.jsx` — Elaboration form
- `FormAddInstrument.jsx` — Instrument selector
- `VirtualizedInstrumentAutocomplete.jsx` — Search

### Key States
- **Selecting**: Choosing instruments
- **Calculating**: Price computed
- **Confirming**: Final review
- **Generating**: PDF creation
- **Complete**: Success

## Data & Permissions

### Entities Touched
- `Proposta` — Update
- `InstrumentoDoCliente` — Read

### Permissions
- **Staff Only**: Elaborate proposals

## Edge Cases & Failures

### Validation Errors
- No instruments: Required

### Network/Integration Failures
- PDF generation failure: Error message

## Observability

### Logs/Events
- Elaboration steps, completion

## Open Questions

- [ ] Should elaboration be saveable as draft?

