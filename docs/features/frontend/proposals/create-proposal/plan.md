# Feature: Create Proposal

## Feature Summary

Form for creating a new commercial proposal, selecting a client and initial configuration.

## User Value

### Problem Solved
Staff needs to initiate new proposals for calibration services.

### Who Benefits
- **Commercial Managers**: Create quotations

## Scope

### In Scope
- Client selection
- Location setting (lab/client site)
- Initial notes

### Out of Scope
- Instrument selection (done in elaborate)
- PDF generation (done in elaborate)

## User Flow

### Primary Flow
1. Staff clicks "New Proposal"
2. Staff selects client
3. Staff sets location
4. System creates draft proposal
5. Navigate to proposal details

## Acceptance Criteria

- [ ] Client selector with search
- [ ] Location dropdown
- [ ] Creates proposal in draft status
- [ ] Redirects to detail page

## Frontend Behavior

### Screens/Components
- `FormCreateProposal.jsx` — Creation form

### Key States
- **Initial**: Empty form
- **Selecting**: Client search
- **Creating**: Saving
- **Created**: Redirect

## Data & Permissions

### Entities Touched
- `Proposta` — Create
- `Cliente` — Read (selection)

### Permissions
- **Staff Only**: Create proposals

## Edge Cases & Failures

### Missing Data
- No clients: Show message

## Observability

### Logs/Events
- Proposal creation logged

## Open Questions

- [ ] Should drafts auto-save?

