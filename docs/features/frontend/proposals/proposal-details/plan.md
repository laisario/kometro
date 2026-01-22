# Feature: Proposal Details

## Feature Summary

Displays complete proposal information including instruments, pricing, status, and provides actions for elaboration, approval, and PDF download.

## User Value

### Problem Solved
Users need to view all proposal information and take actions based on their role.

### Who Benefits
- **Commercial Managers**: Review and elaborate proposals
- **Clients**: Review and approve/reject proposals

## Scope

### In Scope
- Proposal information display
- Instrument list with pricing
- Status and action buttons
- PDF preview/download
- Attachments

### Out of Scope
- Editing approved proposals
- Version comparison

## User Flow

### Primary Flow
1. User clicks proposal from list
2. System loads proposal details
3. User reviews information
4. User takes action (elaborate/approve/reject)

## Acceptance Criteria

- [ ] Shows proposal number, status, dates
- [ ] Shows client information
- [ ] Lists instruments with pricing
- [ ] Shows total and discount
- [ ] Appropriate action buttons per status

## Frontend Behavior

### Screens/Components
- `ProposalDetailsPage.jsx` — Main page
- `InformationProposal.jsx` — Info cards
- `Assets.jsx` — Instrument list
- `ProposalDetailsPreview.jsx` — PDF preview

### Key States
- **Loading**: Skeleton
- **Draft**: Elaborate button
- **Awaiting**: Approve/Reject buttons
- **Approved/Rejected**: View only

## Data & Permissions

### Entities Touched
- `Proposta` — Read
- `InstrumentoDoCliente` — Read

### Permissions
- **Staff**: Full actions
- **Clients**: Approve/reject only

## Edge Cases & Failures

### Missing Data
- Proposal not found: 404

## Observability

### Logs/Events
- Detail views, actions taken

## Open Questions

- [ ] Should there be edit capability for drafts?

