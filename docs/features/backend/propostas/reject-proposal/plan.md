# Feature: Reject Proposal

## Feature Summary

Client rejects a proposal that was awaiting their decision. Changes the proposal status to "Rejected", records the date, and decrements the client's pending proposals counter.

## User Value

### Problem Solved
Clients may decide not to proceed with a proposal. This provides a clear rejection mechanism and closes out the proposal workflow.

### Who Benefits
- **Clients**: Formally decline proposals
- **Commercial Managers**: Know proposals that need revision or follow-up

## Scope

### In Scope
- Change status to "Reprovada"
- Set date
- Decrement pending counter

### Out of Scope
- Rejection reason capture
- Automatic follow-up scheduling
- Counter-proposal workflow

## User Flow

### Primary Flow
1. Client receives proposal
2. Client reviews and decides not to proceed
3. Client clicks "Reject"
4. System updates status
5. System records rejection date
6. System decrements pending count

### Alternate Flows

#### Already Rejected
- Idempotent operation

## Acceptance Criteria

- [ ] Changes status to "R" (Reprovada)
- [ ] Sets data_aprovacao to today (repurposed field)
- [ ] Decrements cliente.propostas_aguardando_aprovacao
- [ ] Returns success message
- [ ] Counter not decremented below 0

## Backend Behavior

### Endpoints
- `POST /propostas/{id}/reprovar/` — Reject proposal

### Response
```json
{
  "message": "Proposta recusada com sucesso!"
}
```

### Business Rules
- Status changes to "R"
- data_aprovacao set (used for both approve/reject date)
- Client counter decremented (with floor check)

### Validations
- Proposal must exist
- User must be authenticated

## Data & Permissions

### Entities Touched
- `Proposta` — Update
- `Cliente` — Update (pending count)

### Permissions
- **Authenticated Users**: Reject own client's proposals
- **Staff Users**: Reject any proposal

## Edge Cases & Failures

### Validation Errors
- N/A

### Missing Data
- Proposal not found: Return 404

### Permission Denied
- Rejecting another client's proposal: Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Rejection: proposal ID, user, date

### Metrics
- Rejections per period
- Rejection rate

## Open Questions

- [ ] Should rejection require reason/comment?
- [ ] Should rejected proposals be re-openable?
- [ ] Should data_aprovacao be renamed to data_decisao?

