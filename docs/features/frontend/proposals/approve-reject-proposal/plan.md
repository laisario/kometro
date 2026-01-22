# Feature: Approve/Reject Proposal

## Feature Summary

Action buttons and confirmation dialogs for clients to approve or reject proposals awaiting their decision.

## User Value

### Problem Solved
Clients need a clear way to accept or decline calibration service proposals.

### Who Benefits
- **Quality Managers (Clients)**: Make purchase decisions
- **Commercial Managers**: Get clear answers

## Scope

### In Scope
- Approve button with confirmation
- Reject button with confirmation
- Status update feedback

### Out of Scope
- Partial approval
- Approval comments
- Counter-proposals

## User Flow

### Primary Flow (Approve)
1. Client views proposal details
2. Client clicks "Approve"
3. Confirmation dialog appears
4. Client confirms
5. Status updates to Approved

### Primary Flow (Reject)
1. Client views proposal details
2. Client clicks "Reject"
3. Confirmation dialog appears
4. Client confirms
5. Status updates to Rejected

## Acceptance Criteria

- [ ] Approve button visible for Awaiting status
- [ ] Reject button visible for Awaiting status
- [ ] Confirmation required before action
- [ ] Status updates immediately
- [ ] Success message shown

## Frontend Behavior

### Screens/Components
- `MenuButton.jsx` — Action buttons
- Confirmation dialog (MUI)

### Key States
- **Available**: Buttons enabled
- **Confirming**: Dialog open
- **Processing**: API call
- **Completed**: Success feedback

## Data & Permissions

### Entities Touched
- `Proposta` — Update

### Permissions
- **Client Users**: Approve/reject own proposals
- **Staff**: Can also approve/reject

## Edge Cases & Failures

### Validation Errors
- Already processed: Show message

### Network/Integration Failures
- API failure: Error toast, retry

## Observability

### Logs/Events
- Decisions logged

## Open Questions

- [ ] Should rejection require reason?

