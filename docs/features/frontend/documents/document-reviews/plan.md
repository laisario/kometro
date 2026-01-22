# Feature: Document Reviews

## Feature Summary

Page showing complete revision history for a document with approval details per revision.

## User Value

### Problem Solved
Users need audit trail of all document revisions and approvals.

### Who Benefits
- **Document Control Specialists**: Track history
- **Auditors**: Verify revision chain
- **Quality Managers**: Review compliance

## Scope

### In Scope
- List all revisions
- Show revision details
- Show approval status per revision
- Timeline view

### Out of Scope
- Version comparison
- Content diff

## User Flow

### Primary Flow
1. User clicks "View History"
2. System loads all revisions
3. User views revision timeline
4. User clicks revision for details

## Acceptance Criteria

- [ ] Lists all revisions chronologically
- [ ] Shows revisor and date
- [ ] Shows change description
- [ ] Shows approval status
- [ ] Links to revision details

## Frontend Behavior

### Screens/Components
- `DocumentReviews.jsx` — History page
- `ReviewCard.jsx` — Revision item

### Key States
- **Loading**: Spinner
- **Loaded**: Timeline displayed

## Data & Permissions

### Entities Touched
- `Revisao` — Read
- `Aprovacao` — Read

### Permissions
- **All Authenticated Users**: View history

## Edge Cases & Failures

### Missing Data
- No revisions: Show message

## Observability

### Logs/Events
- History views logged

## Open Questions

- [ ] Should old revisions be collapsible?

