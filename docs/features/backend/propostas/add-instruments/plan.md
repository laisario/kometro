# Feature: Add Instruments

## Feature Summary

Associates multiple instruments with a proposal. Replaces the current instrument set with the provided list. Resets proposal status to indicate changes were made.

## User Value

### Problem Solved
Proposals need instruments selected to define the scope and calculate pricing. This allows setting the complete instrument list for a proposal.

### Who Benefits
- **Commercial Managers**: Select instruments for calibration quotation
- **Clients**: See which instruments are included in proposal

## Scope

### In Scope
- Set instruments on proposal (M2M relationship)
- Replace existing selection with new list
- Reset status to indicate modification

### Out of Scope
- Individual instrument add/remove
- Instrument validation against client
- Automatic pricing calculation

## User Flow

### Primary Flow
1. Staff opens proposal
2. Staff selects instruments from client's inventory
3. Staff saves selection
4. System replaces instrument set
5. System resets status to AA if needed

### Alternate Flows

#### Empty Selection
- Clears all instruments
- Proposal has no instruments

## Acceptance Criteria

- [ ] Accepts list of instrument IDs
- [ ] Replaces existing M2M set
- [ ] Sets status to "AA" (Awaiting Approval)
- [ ] Returns success message
- [ ] Validates instruments exist

## Backend Behavior

### Endpoints
- `POST /propostas/{id}/adicionar_instrumento/` — Add/set instruments

### Request Body
```json
{
  "instrumentos": [1, 2, 3, 4]
}
```

### Response
```json
{
  "message": "Instrumentos adicionados com sucesso!"
}
```

### Business Rules
- Uses M2M set() which replaces entire relationship
- Status changed to "AA" after modification
- Empty list removes all instruments

### Validations
- Proposal must exist
- Each instrument ID must exist
- User must be authenticated

## Data & Permissions

### Entities Touched
- `Proposta` — Update (status, M2M)
- `InstrumentoDoCliente` — Read

### Permissions
- **Authenticated Users**: Modify own client's proposals
- **Staff Users**: Modify any proposal

## Edge Cases & Failures

### Validation Errors
- Invalid instrument ID: Raises exception

### Missing Data
- Proposal not found: Return 404
- Instrument not found: Return 400/500

### Permission Denied
- Modifying another client's proposal: Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Instruments set: proposal ID, count, user

### Metrics
- Average instruments per proposal

## Open Questions

- [ ] Should instruments be validated as belonging to same client?
- [ ] Should individual add/remove be supported?

