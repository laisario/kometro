# Feature: Delete Instrument

## Feature Summary

Permanently removes an instrument instance (InstrumentoDoCliente) from the system. Decrements the client's instrument count and cascades deletion to related records including calibrations, certificates, and movement history.

## User Value

### Problem Solved
Instruments become obsolete, are disposed of, or were entered in error. Users need to remove these from the system to maintain accurate inventory and prevent confusion.

### Who Benefits
- **Quality Managers**: Remove disposed or retired instruments from tracking
- **Administrators**: Clean up erroneous data entries
- **Maintenance Supervisors**: Remove instruments no longer in their scope

## Scope

### In Scope
- Delete instrument and cascade to related records
- Decrement client's instrument count
- Remove from any proposals (M2M relationship)

### Out of Scope
- Soft delete / archive functionality
- Bulk deletion
- Restoration of deleted instruments

## User Flow

### Primary Flow
1. User selects instrument to delete
2. User confirms deletion intention
3. System validates user has permission
4. System deletes instrument and related records
5. System decrements client instrument count
6. System returns 204 No Content

### Alternate Flows

#### Instrument in Active Proposal
- Instrument is removed from proposal's M2M relationship
- Proposal continues to exist without that instrument

#### Confirmation Required
- Frontend should require user confirmation before calling delete
- Backend does not enforce confirmation (stateless)

## Acceptance Criteria

- [ ] Deletes instrument and all related records
- [ ] Decrements client's `instrumentos_cadastrados` count
- [ ] Removes instrument from all associated proposals
- [ ] Returns 204 No Content on success
- [ ] Returns 404 if instrument not found

## Backend Behavior

### Endpoints
- `DELETE /instrumentos/{id}/` — Delete instrument

### Cascade Deletions
The following are deleted via cascade (on_delete=CASCADE):
- `Calibracao` — All calibrations for this instrument
- `Certificado` — All certificates (via Calibracao)
- `Anexo` — All attachments (via Certificado)
- `MovimentacaoInstrumento` — All position movement history
- `MovimentacaoSetorInstrumento` — All sector movement history
- `PontoDeCalibracao` — All calibration points
- `CriterioAceitacao` — All acceptance criteria
- `ResultadoCalibracao` — All calibration results

### Business Rules
- Deletion is permanent and cannot be undone
- Client's `instrumentos_cadastrados` is decremented
- M2M relationship with Proposta is cleared (instrument removed from proposals)

### Validations
- Instrument must exist
- User must have permission to delete

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Delete
- `Cliente` — Update (decrement count)
- All cascade-deleted entities (see above)

### Permissions
- **Authenticated Users**: Can delete own client's instruments
- **Staff Users**: Can delete any instrument

## Edge Cases & Failures

### Validation Errors
- N/A (deletion has no input validation)

### Missing Data
- Instrument not found: Return 404

### Permission Denied
- Deleting another client's instrument (non-staff): Return 403

### Network/Integration Failures
- Transaction failure: Rollback, return 500

## Observability

### Logs/Events
- Deletion logged with instrument ID, tag, client ID, user ID
- Cascade deletion counts logged (calibrations deleted, etc.)

### Metrics
- Instruments deleted per period
- Average instrument lifespan before deletion

## Open Questions

- [ ] Should deletion be blocked if instrument has pending calibrations?
- [ ] Should we implement soft delete for audit trail purposes?
- [ ] Should deleted instruments be archived somewhere?

