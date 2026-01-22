# Feature: List Documents

## Feature Summary

Displays a paginated table of controlled documents with filtering by status and expiration, prioritized by review urgency.

## User Value

### Problem Solved
Users need to manage controlled documents, prioritizing those requiring review.

### Who Benefits
- **Document Control Specialists**: Manage document lifecycle
- **Quality Managers**: Monitor document compliance

## Scope

### In Scope
- Paginated document table
- Status and expiration filters
- Search by title
- Urgency ordering

### Out of Scope
- Document content search
- Version comparison

## User Flow

### Primary Flow
1. User navigates to Documents page
2. System loads documents sorted by urgency
3. User filters or searches
4. User clicks to view details

## Acceptance Criteria

- [ ] Shows paginated document list
- [ ] Ordered by analise_critica (urgency)
- [ ] Status filter works
- [ ] Search by title
- [ ] Shows expiration status

## Frontend Behavior

### Screens/Components
- `DocumentsPage.jsx` — Main page
- `TableDocuments.jsx` — Document table
- `TableToolbar.jsx` — Filters

### Key States
- **Loading**: Spinner
- **Empty**: No documents message
- **List**: Documents displayed

## Data & Permissions

### Entities Touched
- `Documento` — Read

### Permissions
- **All Authenticated Users**: View documents

## Edge Cases & Failures

### Missing Data
- No documents: Empty state

## Observability

### Logs/Events
- Page views logged

## Open Questions

- [ ] Should there be folder organization?

