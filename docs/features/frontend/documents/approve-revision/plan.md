# Feature: Approve Revision

## Feature Summary

Action for designated approvers to approve or revoke approval on document revisions.

## User Value

### Problem Solved
Document changes require formal approval before becoming effective.

### Who Benefits
- **Approvers**: Record approval decisions
- **Document Control**: Track approval progress

## Scope

### In Scope
- Approve button for assigned approvers
- Revoke approval option
- Approval status display

### Out of Scope
- Rejection workflow
- Approval comments

## User Flow

### Primary Flow
1. Approver views revision
2. Approver clicks "Approve"
3. System records approval
4. Status updates

### Alternate Flow (Revoke)
1. Approver clicks their existing approval
2. Confirmation dialog
3. Approval removed

## Acceptance Criteria

- [ ] Approve button for assigned approvers
- [ ] Cannot approve own revision
- [ ] Shows approval progress
- [ ] Revoke option for existing approval

## Frontend Behavior

### Screens/Components
- `ReviewCard.jsx` — Approval actions

### Key States
- **Pending**: Can approve
- **Approved**: Can revoke
- **Not Approver**: View only

## Data & Permissions

### Entities Touched
- `Aprovacao` — Create/Delete

### Permissions
- **Assigned Approvers Only**: Approve action

## Edge Cases & Failures

### Validation Errors
- Self-approval: Show error

## Observability

### Logs/Events
- Approvals logged

## Open Questions

- [ ] Should approval notification be sent?

