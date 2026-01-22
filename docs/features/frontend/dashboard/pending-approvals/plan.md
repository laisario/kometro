# Feature: Pending Approvals

## Feature Summary

List of document revisions pending the current user's approval, displayed on the dashboard.

## User Value

### Problem Solved
Approvers need to see what requires their attention.

### Who Benefits
- **Approvers**: Know what needs action
- **Document Control**: Faster approval cycles

## Scope

### In Scope
- List pending revisions
- Show document info
- Navigate to approval

### Out of Scope
- Inline approval
- Bulk approval

## User Flow

### Primary Flow
1. User views dashboard
2. Pending approvals displayed
3. User clicks to review
4. Navigate to document/revision

## Acceptance Criteria

- [ ] Shows revisions needing user's approval
- [ ] Shows document title and urgency
- [ ] Clicking navigates to document

## Frontend Behavior

### Screens/Components
- Dashboard pending section

### Key States
- **Loading**: Spinner
- **Loaded**: Items displayed
- **Empty**: "Nenhuma aprovação pendente"

## Data & Permissions

### Entities Touched
- `Revisao` — Read

### Permissions
- **Assigned Approvers**: See their pending items

## Edge Cases & Failures

### Missing Data
- No pending: Empty message

## Observability

### Logs/Events
- Clicks to pending items logged

## Open Questions

- [ ] Should there be email reminders?

