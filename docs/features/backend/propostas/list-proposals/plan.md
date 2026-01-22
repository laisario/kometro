# Feature: List Proposals

## Feature Summary

Retrieves a paginated list of commercial proposals with filtering and search capabilities. Staff users see all proposals across clients, while regular users only see proposals for their organization.

## User Value

### Problem Solved
Commercial teams need to track multiple proposals across different stages (draft, awaiting approval, approved, rejected). Clients need to see proposals sent to them and their status.

### Who Benefits
- **Commercial Managers**: Track proposal pipeline and status
- **Quality Managers (Clients)**: View and manage proposals for their organization
- **Administrators**: Monitor all commercial activity

## Scope

### In Scope
- Paginated list with search and filters
- Filter by status, date, client
- Search by proposal number and client name
- Different views for staff vs clients

### Out of Scope
- Proposal analytics/reports
- Bulk proposal operations

## User Flow

### Primary Flow
1. User navigates to proposals page
2. System loads first page of proposals
3. User applies filters or search
4. System returns filtered results
5. User clicks proposal to view details

### Alternate Flows

#### Empty State
- No proposals matching filters
- Display appropriate message

## Acceptance Criteria

- [ ] Returns paginated proposals ordered by ID descending
- [ ] Supports search by numero and cliente.empresa.razao_social
- [ ] Staff can filter by client
- [ ] Regular users see only their client's proposals
- [ ] Includes instrument count and total

## Backend Behavior

### Endpoints
- `GET /propostas/` — List proposals

### Query Parameters
- `page` — Page number
- `search` — Search term (numero, client name)
- `status` — Status filter (E, AA, A, R)
- `cliente` — Client ID (staff only)

### Response includes
- numero, status, total, data_criacao, data_aprovacao
- cliente info
- instrumentos count

### Business Rules
- Results ordered by pk descending (newest first)
- Staff sees all client proposals
- Non-staff filtered to their client

### Validations
- User must be authenticated

## Data & Permissions

### Entities Touched
- `Proposta` — Read
- `Cliente` — Read (via relationship)

### Permissions
- **Authenticated Users**: View own client's proposals
- **Staff Users**: View all proposals

## Edge Cases & Failures

### Validation Errors
- Invalid status filter: Ignored or returns empty

### Missing Data
- User without client: Return empty list

### Permission Denied
- Non-staff viewing other client's proposals: Filtered out

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- List queries logged with filters used

### Metrics
- Proposals viewed per user
- Filter usage patterns

## Open Questions

- [ ] Should date range filtering be added?

