# Feature: Update Instrument

## Feature Summary

Updates an existing instrument instance (InstrumentoDoCliente) with new values. Supports both full updates (PUT) and partial updates (PATCH). Changes to position or frequency trigger recalculation of next calibration dates.

## User Value

### Problem Solved
Instrument details change over time — serial numbers may be corrected, frequencies adjusted, sectors reorganized. Users need to keep instrument records current without recreating them.

### Who Benefits
- **Quality Managers**: Adjust calibration frequencies based on risk assessments
- **Lab Technicians**: Correct instrument details after data entry errors
- **Maintenance Supervisors**: Reassign instruments to different sectors

## Scope

### In Scope
- Update all mutable instrument fields
- Recalculate next calibration date when frequency or position changes
- Record sector movements in history
- Update acceptance criteria
- Update normative associations

### Out of Scope
- Changing the base instrument type (requires delete + recreate)
- Changing the owning client (requires delete + recreate)
- Bulk updates (separate feature)

## User Flow

### Primary Flow
1. User opens instrument details
2. User modifies desired fields
3. User submits changes
4. System validates changes
5. System updates instrument and recalculates dates if needed
6. System returns 204 No Content on success

### Alternate Flows

#### Position Change
- If position changes, system creates MovimentacaoInstrumento record
- If position changes to/from "In Use", recalculates next calibration date

#### Frequency Change
- System recalculates next calibration/verification dates
- Does not affect past calibration records

## Acceptance Criteria

- [ ] Updates instrument with provided fields
- [ ] Recalculates next calibration date when frequency changes
- [ ] Recalculates next calibration date when position changes (service time criterion)
- [ ] Updates expiration flag based on new next calibration date
- [ ] Does not allow changing client or base instrument type
- [ ] Returns 204 No Content on success

## Backend Behavior

### Endpoints
- `PUT /instrumentos/{id}/` — Full update (all fields required)
- `PATCH /instrumentos/{id}/` — Partial update (only provided fields)

### Request Body (PATCH example)
```json
{
  "tag": "TERM-001-A",
  "posicao": "E",
  "setor": 2,
  "frequencia_calibracao": 3
}
```

### Business Rules
- Tag must remain unique within client if changed
- Position changes trigger movimentação record creation
- Frequency changes trigger date recalculation using `atualizar_datas()` method
- Expiration flag (`expirado`) is automatically updated based on `data_proxima_calibracao`
- Changes propagate to related proposals (proposal.save() called)

### Validations
- `tag` — Must be unique within client if changed
- `posicao` — Must be valid choice
- `setor` — Must belong to same client
- `frequencia_calibracao` — Must exist if provided
- `frequencia_checagem` — Must exist if provided

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Update
- `MovimentacaoInstrumento` — Create (if position changes)
- `MovimentacaoSetorInstrumento` — Create (if sector changes)
- `Proposta` — Update (via save trigger)

### Permissions
- **Authenticated Users**: Can update own client's instruments
- **Staff Users**: Can update any instrument

## Edge Cases & Failures

### Validation Errors
- Duplicate tag: Return 400 with constraint violation message
- Invalid sector (different client): Return 400

### Missing Data
- Instrument not found: Return 404

### Permission Denied
- Updating another client's instrument (non-staff): Return 403

### Network/Integration Failures
- Transaction failure: Rollback changes, return 500

## Observability

### Logs/Events
- Update with old vs new values for key fields
- Position changes logged with user
- Sector changes logged with user

### Metrics
- Updates per instrument over time
- Position change frequency
- Fields most commonly updated

## Open Questions

- [ ] Should certain fields be immutable after first calibration?
- [ ] Should position changes require approval workflow?

