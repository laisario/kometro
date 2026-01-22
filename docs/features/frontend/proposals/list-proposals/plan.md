# Feature: List Proposals

## Feature Summary

Displays a paginated table of commercial proposals with filtering by status and search capabilities. Different views for staff (all clients) vs client users (own proposals).

## User Value

### Problem Solved
Users need to track proposal pipeline, find specific proposals, and monitor approval status.

### Who Benefits
- **Commercial Managers**: Track all proposals
- **Quality Managers (Clients)**: View proposals received
- **Administrators**: Monitor commercial activity

## Scope

### In Scope
- Paginated proposal table
- Status filter (Draft, Awaiting, Approved, Rejected)
- Search by proposal number and client
- Quick actions (view, download PDF)

### Out of Scope
- Proposal analytics
- Bulk operations

## User Flow

### Primary Flow
1. User navigates to Propostas page
2. System loads proposals
3. User filters by status
4. User searches for specific proposal
5. User clicks to view details

## Acceptance Criteria

- [ ] Shows paginated proposal list
- [ ] Status filter works
- [ ] Search by numero and client name
- [ ] Staff sees all clients' proposals
- [ ] Click navigates to details

## Frontend Behavior

### Screens/Components
- `ProposalsPage.jsx` — Main page
- `TableToolbar.jsx` — Search and filters

### Key States
- **Loading**: Spinner
- **Empty**: No proposals message
- **Filtered**: Applied filters shown

## Data & Permissions

### Entities Touched
- `Proposta` — Read

### Permissions
- **All Authenticated Users**: View accessible proposals

## Edge Cases & Failures

### Missing Data
- No proposals: Empty state

## Observability

### Logs/Events
- Page views, searches, filter usage

## Open Questions

- [ ] Should there be date range filtering?

