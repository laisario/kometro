# Feature: Billing Release

## Feature Summary

Updates proposal with billing-related information when services are complete and ready for invoicing. Records billing release date, user, and invoice numbers.

## User Value

### Problem Solved
After calibration services are complete, proposals need to be marked for billing with relevant invoice tracking information.

### Who Benefits
- **Commercial Managers**: Track billing readiness
- **Finance Team**: Know which proposals are ready for invoicing

## Scope

### In Scope
- Update billing fields
- Record release timestamp
- Store invoice numbers

### Out of Scope
- Invoice generation
- Payment tracking
- Financial integration

## User Flow

### Primary Flow
1. Services complete
2. Staff releases for billing
3. System records billing info
4. Proposal ready for invoicing

## Acceptance Criteria

- [ ] Updates billing fields
- [ ] Records release date/time
- [ ] Stores NF entrada and NF numbers
- [ ] Returns success status

## Backend Behavior

### Endpoints
- `PATCH /propostas/{id}/liberar_para_faturamento/` — Release for billing

### Request Body
```json
{
  "data_liberacao_faturamento": "2025-01-15T10:00:00Z",
  "usuario_liberou_faturamento": "admin",
  "nf_entrada": "12345",
  "nf": "67890",
  "realizado": true
}
```

### Business Rules
- Uses PropostaFaturamentoSerializer
- Partial update supported

### Validations
- Proposal must exist
- Data format validation

## Data & Permissions

### Entities Touched
- `Proposta` — Update

### Permissions
- **Authenticated Users**: Release own client's proposals
- **Staff Users**: Release any

## Edge Cases & Failures

### Validation Errors
- Invalid data: Return 400 with errors

### Missing Data
- Proposal not found: Return 404

## Observability

### Logs/Events
- Billing release: proposal ID, user, timestamp

### Metrics
- Time from approval to billing release

## Open Questions

- [ ] Should billing release be restricted to approved proposals?
- [ ] Should release trigger notifications?

