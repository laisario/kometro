# Feature: Update Sector

## Feature Summary

Updates an existing sector's name or parent sector reference. Invalidates cache for affected clients.

## User Value

### Problem Solved
Sector names or organizational structure may change over time.

### Who Benefits
- **Administrators**: Maintain accurate structure

## Scope

### In Scope
- Update sector name
- Change parent sector
- Cache invalidation

### Out of Scope
- Bulk updates

## User Flow

### Primary Flow
1. User edits sector
2. System updates and invalidates cache

## Acceptance Criteria

- [ ] Updates sector fields
- [ ] Invalidates cache for old and new client (if changed)

## Backend Behavior

### Endpoints
- `PUT /setores/{id}/` — Full update
- `PATCH /setores/{id}/` — Partial update

### Business Rules
- Cache invalidated for affected clients
- Parent change affects hierarchy

### Validations
- Sector must exist

## Data & Permissions

### Entities Touched
- `Setor` — Update
- Cache — Delete

### Permissions
- **NivelPermission**: Role-based

## Edge Cases & Failures

### Missing Data
- Sector not found: Return 404

## Observability

### Logs/Events
- Sector updated: ID, changes

## Open Questions

- [ ] Should circular parent references be prevented?

