# Feature: Approve Proposal

## Feature Summary

Client approves a proposal that was awaiting their decision. Changes the proposal status to "Approved", records the approval date, and decrements the client's pending proposals counter.

## User Value

### Problem Solved
Clients need to formally accept proposals to proceed with calibration services. This action creates a clear record of approval.

### Who Benefits
- **Clients**: Confirm acceptance of proposals
- **Commercial Managers**: Know which proposals have been accepted
- **Quality Managers**: Track approved work

## Scope

### In Scope
- Change status to "Aprovada"
- Set approval date
- Decrement pending proposals counter

### Out of Scope
- Partial approval
- Approval with conditions
- Work order generation

## User Flow

### Primary Flow
1. Client receives proposal
2. Client reviews proposal details
3. Client clicks "Approve"
4. System updates status
5. System records approval date
6. System decrements pending count

### Alternate Flows

#### Already Approved
- Attempting to approve already approved proposal
- Idempotent operation

## Acceptance Criteria

- [ ] Changes status to "A" (Aprovada)
- [ ] Sets data_aprovacao to today
- [ ] Decrements cliente.propostas_aguardando_aprovacao
- [ ] Returns success message
- [ ] Counter not decremented below 0

## Backend Behavior

### Endpoints
- `POST /propostas/{id}/aprovar/` — Approve proposal

### Response
```json
{
  "message": "Proposta aprovada com sucesso!"
}
```

### Business Rules
- Status changes to "A"
- data_aprovacao set to date.today()
- Client counter decremented (with 0 floor check)
- No validation of current status

### Validations
- Proposal must exist
- User must be authenticated

## Data & Permissions

### Entities Touched
- `Proposta` — Update
- `Cliente` — Update (pending count)

### Permissions
- **Authenticated Users**: Approve own client's proposals
- **Staff Users**: Approve any proposal

## Edge Cases & Failures

### Validation Errors
- N/A

### Missing Data
- Proposal not found: Return 404

### Permission Denied
- Approving another client's proposal: Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Approval: proposal ID, client ID, user, date

### Metrics
- Approvals per day
- Time from elaboration to approval

## Open Questions

- [ ] Should approval require comment/justification?
- [ ] Should approval trigger service order creation?

