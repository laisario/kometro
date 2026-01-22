# Feature: Delete Sector

## Feature Summary

Removes a sector with configurable handling of contained instruments. Supports moving instruments to another sector, deleting them, or creating a new sector for them.

## User Value

### Problem Solved
Organizational restructuring requires removing sectors while properly handling the instruments they contain.

### Who Benefits
- **Administrators**: Safely reorganize structure
- **Quality Managers**: Ensure instrument continuity

## Scope

### In Scope
- Delete sector
- Handle child instruments via options
- Handle subsectors
- Cache invalidation

### Out of Scope
- Undo deletion

## User Flow

### Primary Flow
1. User selects sector to delete
2. User chooses action for instruments
3. System moves/deletes instruments
4. System deletes sector and subsectors
5. Cache invalidated

### Action Options
- Default: Move to "Padrão" sector
- delete_all: Delete all instruments
- transfer_existing: Move to specified sector
- transfer_new: Create new sector and move

## Acceptance Criteria

- [ ] Cannot delete "Padrão" sector
- [ ] Handles instruments per action parameter
- [ ] Deletes subsectors
- [ ] Invalidates cache
- [ ] Returns appropriate status

## Backend Behavior

### Endpoints
- `DELETE /setores/{id}/` — Delete sector

### Request Body
```json
{
  "action": "transfer_existing",
  "targetSetorId": 5,
  "instrumentsToMove": [1, 2, 3],
  "instrumentsToDelete": [4, 5]
}
```

### Action Types
- `null` — Move all to "Padrão"
- `delete_all` — Delete all instruments
- `transfer_existing` — Move to target sector
- `transfer_new` — Create new sector and move

### Business Rules
- "Padrão" sector is protected
- Subsectors processed recursively
- Custom delete() method on model

### Validations
- Sector must exist
- Cannot be "Padrão"

## Data & Permissions

### Entities Touched
- `Setor` — Read/Delete
- `InstrumentoDoCliente` — Update/Delete
- Cache — Delete

### Permissions
- **NivelPermission**: Role-based

## Edge Cases & Failures

### Validation Errors
- Deleting "Padrão": Return 400

### Missing Data
- Target sector not found: Return 404

## Observability

### Logs/Events
- Sector deleted: action, instrument counts

## Open Questions

- [ ] Should deletion require confirmation?

