# Feature: Instrument Types

## Feature Summary

Provides a read-only list of instrument types (TipoInstrumento) available for the current client, used for filtering and categorization in the UI. Returns types that have at least one instrument associated with the client.

## User Value

### Problem Solved
Users need to filter instruments by type, but should only see types that are relevant to their organization. This endpoint provides the list of types that actually have instruments for the client.

### Who Benefits
- **All Users**: Filter instruments efficiently by relevant types
- **Quality Managers**: Understand instrument type distribution
- **Administrators**: See which types are active in the system

## Scope

### In Scope
- List instrument types for client's instruments
- Search by description, model, manufacturer
- Staff can filter by client_id parameter

### Out of Scope
- Creating new instrument types
- Updating instrument types
- Deleting instrument types
- Types without associated instruments

## User Flow

### Primary Flow
1. User opens instrument filter dropdown
2. Frontend requests instrument types
3. System returns types with instruments for client
4. User selects type to filter by

### Alternate Flows

#### No Types Available
- New client with no instruments
- Returns empty list

## Acceptance Criteria

- [ ] Returns only TipoInstrumento with client's instruments
- [ ] Supports search by description, model, manufacturer
- [ ] Staff users can filter by client_id parameter
- [ ] Results ordered by description alphabetically
- [ ] No pagination (full list returned)

## Backend Behavior

### Endpoints
- `GET /tipos-instrumento/` — List instrument types

### Query Parameters
- `search` — Search term for description, model, manufacturer
- `cliente_id` — Client filter (staff only)

### Response
```json
[
  {
    "id": 1,
    "descricao": "Termômetro Digital",
    "modelo": "TD-100",
    "fabricante": "Incoterm",
    "resolucao": 0.1
  }
]
```

### Business Rules
- Filters to types that have InstrumentoDoCliente for the client
- Uses distinct() to avoid duplicates from joins
- Non-staff users auto-filtered to their client
- Staff users can specify client_id or see all

### Validations
- User must be authenticated
- client_id (if provided) must be valid

## Data & Permissions

### Entities Touched
- `TipoInstrumento` — Read
- `Instrumento` — Read (via join)
- `InstrumentoDoCliente` — Read (via join)

### Permissions
- **Authenticated Users**: View types for own client
- **Staff Users**: View types for any client (with client_id) or all

## Edge Cases & Failures

### Validation Errors
- Invalid client_id: Return empty list or 400

### Missing Data
- User has no client: Return empty list
- No instruments: Return empty list

### Permission Denied
- N/A (auto-filtered by client)

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Query logging for performance monitoring

### Metrics
- Types returned per query
- Search term frequency

## Open Questions

- [ ] Should types without instruments be visible to staff?
- [ ] Should pagination be added for large type catalogs?

