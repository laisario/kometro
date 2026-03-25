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
- **transfer_existing** (default in API): Move selected instruments to a specified sector (must belong to the same client)
- **transfer_new**: Create a new sector and move instruments there
- **delete_all**: Delete all instruments in the sector
- **Implicit model path** (`action is None` in `Setor.delete`, not the HTTP default): Move instruments to "Padrão" via `get_or_create` — distinct from `transfer_existing` in `SetorViewSet.destroy` (which defaults to `transfer_existing`)

## Acceptance Criteria

- [ ] Any sector can be deleted (including nome `"Padrão"`) when instrument handling rules are satisfied
- [ ] Handles instruments per action parameter
- [ ] Deletes subsectors
- [ ] Invalidates cache
- [ ] Returns appropriate status
- [ ] `transfer_existing` rejects a target sector that belongs to another client (400)

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
- `null` (model only, not HTTP default) — Move all to "Padrão" via `get_or_create`
- `delete_all` — Delete all instruments
- `transfer_existing` — Move to target sector (same `cliente` as the sector being deleted)
- `transfer_new` — Create new sector and move

### Business Rules
- Subsectors processed recursively
- Custom delete() method on model
- `Calibracao.setor` uses `on_delete=SET_NULL`: deleting a sector nulls calibration rows that pointed at it (calibrações are not cascade-deleted)

### Validations
- Sector must exist
- Target sector for `transfer_existing` must belong to the same client as the sector being deleted

## Data & Permissions

### Entities Touched
- `Setor` — Read/Delete
- `InstrumentoDoCliente` — Update/Delete
- `Calibracao` — `setor_id` may be set to NULL when a sector is removed
- Cache — Delete

### Permissions
- **NivelPermission**: Role-based

## Edge Cases & Failures

### Validation Errors
- Target sector not found: Return 404
- Target sector belongs to another client: Return 400

### Missing Data
- Target sector not found: Return 404

## Observability

### Logs/Events
- Sector deleted: action, instrument counts

## Open Questions

- [ ] Should deletion require confirmation?
