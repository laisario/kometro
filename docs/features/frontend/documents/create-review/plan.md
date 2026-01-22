# Feature: Create Review

## Feature Summary

Form for creating a new document revision, specifying type (revise/revalidate), change description, and selecting approvers.

## User Value

### Problem Solved
Documents need periodic review with change tracking and approval workflow.

### Who Benefits
- **Document Control Specialists**: Initiate reviews
- **Quality Managers**: Ensure compliance

## Scope

### In Scope
- Revision type selection
- Change description entry
- Approver selection
- Create revision record

### Out of Scope
- File update
- Concurrent revisions

## User Flow

### Primary Flow
1. User clicks "Create Revision"
2. User selects type (Revise/Revalidate)
3. User enters change description
4. User selects approvers
5. System creates revision
6. Approvers notified

## Acceptance Criteria

- [ ] Type selection (revisar/revalidar)
- [ ] Change description textarea
- [ ] Multi-select approvers
- [ ] Validation before save
- [ ] Creates revision on save

## Frontend Behavior

### Screens/Components
- `FormCreateReview.jsx` — Review form

### Key States
- **Open**: Form visible
- **Filling**: Data entry
- **Submitting**: API call
- **Created**: Success, close

## Data & Permissions

### Entities Touched
- `Revisao` — Create

### Permissions
- **Edit Permission**: Create revisions

## Edge Cases & Failures

### Validation Errors
- No approvers: Required

## Observability

### Logs/Events
- Revision creation logged

## Open Questions

- [ ] Should revisor be auto-excluded from approvers?

