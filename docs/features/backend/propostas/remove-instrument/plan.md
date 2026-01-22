# Feature: Remove Instrument

## Feature Summary

Removes a single instrument from a proposal's instrument list. Resets the proposal status to indicate modification.

## User Value

### Problem Solved
When adjusting a proposal, users may need to remove specific instruments without clearing the entire selection.

### Who Benefits
- **Commercial Managers**: Fine-tune proposal scope
- **Clients**: Request specific changes

## Scope

### In Scope
- Remove single instrument from M2M
- Reset status after modification

### Out of Scope
- Bulk removal
- Reason tracking

## User Flow

### Primary Flow
1. User views proposal instruments
2. User clicks remove on specific instrument
3. System removes from M2M
4. System updates status

### Alternate Flows

#### Instrument Not in Proposal
- No error, idempotent

## Acceptance Criteria

- [ ] Removes specified instrument from proposal
- [ ] Sets status to "AA"
- [ ] Returns success message
- [ ] Idempotent if instrument not present

## Backend Behavior

### Endpoints
- `POST /propostas/{id}/remover_instrumento/` — Remove instrument

### Request Body
```json
{
  "instrumento_id": 123
}
```

### Response
```json
{
  "message": "Instrumento removido com sucesso!"
}
```

### Business Rules
- Uses M2M remove()
- Status set to "AA"
- Does not fail if instrument not in set

### Validations
- Proposal must exist
- instrumento_id must exist

## Data & Permissions

### Entities Touched
- `Proposta` — Update
- `InstrumentoDoCliente` — Read

### Permissions
- **Authenticated Users**: Remove from own proposals
- **Staff Users**: Remove from any proposal

## Edge Cases & Failures

### Validation Errors
- Invalid instrument ID: Exception

### Missing Data
- Proposal not found: Return 404

### Permission Denied
- Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Instrument removed: proposal ID, instrument ID, user

### Metrics
- Instruments removed per proposal

## Open Questions

- [ ] Should removal confirmation be required?

