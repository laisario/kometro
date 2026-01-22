# Feature: List Clients

## Feature Summary

Staff-only page showing all client organizations with search capabilities.

## User Value

### Problem Solved
Staff needs to manage multiple client organizations.

### Who Benefits
- **Staff/Administrators**: Client management
- **Commercial Managers**: Client lookup

## Scope

### In Scope
- Paginated client list
- Search by company name
- Navigate to client details

### Out of Scope
- Client creation
- Bulk operations

## User Flow

### Primary Flow
1. Staff navigates to Clients
2. System loads client list
3. Staff searches for client
4. Staff clicks to view details

## Acceptance Criteria

- [ ] Shows paginated client list
- [ ] Search by company name
- [ ] Shows key info (name, CNPJ)
- [ ] Click navigates to details

## Frontend Behavior

### Screens/Components
- `ClientsPage.jsx` — Client list

### Key States
- **Loading**: Spinner
- **Loaded**: List displayed
- **Empty**: No clients

## Data & Permissions

### Entities Touched
- `Cliente` — Read

### Permissions
- **Staff Only**: Access page

## Edge Cases & Failures

### Missing Data
- No clients: Empty state

## Observability

### Logs/Events
- Client list views

## Open Questions

- [ ] Should there be status filtering?

