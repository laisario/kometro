# Feature: List Instruments

## Feature Summary

Retrieves a paginated list of client instruments (InstrumentoDoCliente) with support for filtering, searching, and sorting. Staff users can view instruments across all clients, while regular users only see instruments belonging to their organization.

## User Value

### Problem Solved
Users need to quickly find and browse through potentially hundreds of instruments in their inventory. Without filtering and pagination, finding specific instruments would be time-consuming and impractical.

### Who Benefits
- **Quality Managers**: Need to review instrument status across departments
- **Lab Technicians**: Need to locate specific instruments for calibration work
- **Maintenance Supervisors**: Need to find instruments by sector or status

## Scope

### In Scope
- Paginated list retrieval with configurable page size
- Search by tag, instrument type description, model, manufacturer, and normative names
- Filtering by position, calibration status, sector, and expiration dates
- Staff view with client filtering capability
- Different serializers for list vs detail views (optimized for performance)

### Out of Scope
- Bulk operations on listed instruments
- Real-time updates via WebSocket
- Advanced analytics or aggregations

## User Flow

### Primary Flow
1. User navigates to instruments page
2. System loads first page of instruments
3. User optionally applies filters or search terms
4. System returns filtered/searched results
5. User pages through results as needed

### Alternate Flows

#### Empty State
- When no instruments match criteria, return empty list with count: 0
- UI displays appropriate "no results" message

#### Error State
- Database connection errors return 500 status
- Invalid filter parameters return 400 with validation errors

## Acceptance Criteria

- [ ] Returns paginated results with page size of 25 by default
- [ ] Search works across tag, type description, model, manufacturer, normative name
- [ ] Regular users only see their client's instruments
- [ ] Staff users can filter by client_id query parameter
- [ ] Results are ordered by ID descending (newest first)
- [ ] Response includes pagination metadata (count, next, previous)

## Backend Behavior

### Endpoints
- `GET /instrumentos/` — List instruments with pagination and filters

### Query Parameters
- `page` — Page number (default: 1)
- `page_size` — Items per page (default: 25, max: 100)
- `search` — Search term for tag, type, model, manufacturer, normative
- `client` — Client ID filter (staff only)
- `posicao` — Position filter (U, E, I, F, C)
- `setor` — Sector ID filter
- `expirado` — Expiration status filter (true/false)

### Business Rules
- Non-staff users are automatically filtered to their associated client
- Staff users must provide client parameter for client-specific views
- Search uses case-insensitive partial matching
- Empty search returns all records within permission scope

### Validations
- User must be authenticated
- Client parameter (for staff) must be valid client ID

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read
- `Instrumento` — Read (via select_related)
- `TipoInstrumento` — Read (via select_related)
- `Normativo` — Read (via prefetch_related)
- `Cliente` — Read (for permission filtering)

### Permissions
- **Authenticated Users**: Can list own client's instruments
- **Staff Users**: Can list any client's instruments with client filter

## Edge Cases & Failures

### Validation Errors
- Invalid page number: Return empty results or 404
- Invalid filter value: Return 400 with error details

### Missing Data
- User not associated with any client: Return empty list

### Permission Denied
- Attempting to access another client's data (non-staff): Filtered out automatically

### Network/Integration Failures
- Database timeout: Return 500 with generic error

## Observability

### Logs/Events
- Request logging with user ID, filters applied, result count
- Slow query logging for requests exceeding 1 second

### Metrics
- Request count by user type (staff/regular)
- Average response time
- Filter usage frequency

## Open Questions

- [ ] Should there be a maximum page size limit?
- [ ] Should search support exact match mode?

