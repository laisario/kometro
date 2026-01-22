# Feature: Billing Approval

## Feature Summary

Form for marking completed proposals as ready for invoicing with invoice tracking information.

## User Value

### Problem Solved
After services are complete, proposals need billing release with proper tracking.

### Who Benefits
- **Commercial Managers**: Track billing status
- **Finance Team**: Know what's ready for invoicing

## Scope

### In Scope
- Mark as realized
- Enter NF numbers
- Record release date

### Out of Scope
- Invoice generation
- Payment tracking

## User Flow

### Primary Flow
1. Staff opens approved proposal
2. Staff clicks billing release
3. Staff enters NF information
4. System records billing data

## Acceptance Criteria

- [ ] Only for approved proposals
- [ ] NF entrada and NF fields
- [ ] Realizado checkbox
- [ ] Saves billing info

## Frontend Behavior

### Screens/Components
- `BillingApprovalForm.jsx` — Billing form

### Key States
- **Available**: Form accessible
- **Filling**: Entering data
- **Saving**: API call
- **Saved**: Confirmation

## Data & Permissions

### Entities Touched
- `Proposta` — Update

### Permissions
- **Staff**: Release for billing

## Edge Cases & Failures

### Validation Errors
- Required fields check

## Observability

### Logs/Events
- Billing releases logged

## Open Questions

- [ ] Should this create external records?

