# Feature: List Clients

## Feature Summary

Retrieves a list of client organizations with search capabilities. Staff users see all clients, while regular users only see their associated organizations.

## User Value

### Problem Solved
Staff need to manage multiple client organizations. Users need to see their organization's profile.

### Who Benefits
- **Staff/Administrators**: Manage client portfolio
- **Commercial Managers**: Find clients for proposals

## Scope

### In Scope
- List clients with pagination
- Search by company name
- Filter to user's clients (non-staff)

### Out of Scope
- Client analytics
- Bulk operations

## User Flow

### Primary Flow
1. Staff navigates to clients
2. System loads client list
3. Staff searches or filters
4. Staff selects client for details

## Acceptance Criteria

- [ ] Returns client list with company info
- [ ] Search by razao_social, nome_fantasia
- [ ] Staff sees all non-staff clients
- [ ] Non-staff sees only their clients

## Backend Behavior

### Endpoints
- `GET /clientes/` — List clients

### Query Parameters
- `search` — Search company names

### Business Rules
- Staff: Filter to clients with non-staff users
- Non-staff: Filter to own associated clients
- Uses ClientesSerializer for list view

### Validations
- User must be authenticated

## Data & Permissions

### Entities Touched
- `Cliente` — Read
- `Empresa` — Read (nested)

### Permissions
- **Authenticated Users**: View associated clients
- **Staff Users**: View all clients

## Edge Cases & Failures

### Missing Data
- No clients: Empty list

## Observability

### Logs/Events
- Query logging

## Open Questions

- [ ] Should inactive clients be hidden?

