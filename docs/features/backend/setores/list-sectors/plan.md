# Feature: List Sectors

## Feature Summary

Retrieves a flat list of sectors (departments/areas) for a specific client. Used for sector selection in forms and filters.

## User Value

### Problem Solved
Users need to see available sectors when assigning instruments or filtering data.

### Who Benefits
- **All Users**: Select sectors in forms
- **Quality Managers**: View organizational structure

## Scope

### In Scope
- List sectors for client
- Filter by client_id parameter

### Out of Scope
- Hierarchical view (separate endpoint)
- Sector analytics

## User Flow

### Primary Flow
1. User opens form with sector selector
2. Frontend requests sectors for client
3. System returns sector list

## Acceptance Criteria

- [ ] Returns sectors for specified client
- [ ] Requires cliente_id parameter
- [ ] Returns paginated results

## Backend Behavior

### Endpoints
- `GET /setores/?cliente_id=X` — List sectors

### Business Rules
- Filter by cliente_id required for list
- Returns flat list, not hierarchy

### Validations
- cliente_id required

## Data & Permissions

### Entities Touched
- `Setor` — Read

### Permissions
- **NivelPermission**: Role-based access

## Edge Cases & Failures

### Missing Data
- No cliente_id: Return all (or empty)

## Observability

### Logs/Events
- Query logging

## Open Questions

- [ ] Should pagination be optional?

