# Feature: Change Position

## Feature Summary

Updates an instrument's position status (In Use, In Stock, Inactive, Out of Service, In Calibration) and records the change in the movement history. Position changes may trigger recalculation of calibration due dates depending on the frequency criterion.

## User Value

### Problem Solved
Instrument positions change frequently — they go out for calibration, return to use, get stored in stock, or become inactive. Tracking these movements is essential for compliance audits and operational visibility.

### Who Benefits
- **Quality Managers**: Track instrument availability and status for audits
- **Lab Technicians**: Know when instruments are available vs out for calibration
- **Maintenance Supervisors**: Monitor instrument utilization in their areas

## Scope

### In Scope
- Update instrument position field
- Create movement history record with old and new position
- Recalculate next calibration date for service-time criterion
- Record user who made the change

### Out of Scope
- Bulk position changes
- Automatic position changes based on calibration events
- Position change approval workflow

## User Flow

### Primary Flow
1. User selects instrument
2. User chooses new position from dropdown
3. System validates position is different from current
4. System creates movement record
5. System updates instrument position
6. System recalculates dates if applicable
7. System returns success with new position

### Alternate Flows

#### Same Position Selected
- System detects no change needed
- Still returns success (idempotent)
- No movement record created

#### Service Time Criterion Active
- Moving to "In Use" sets `data_utilizacao` to today
- Moving from "In Use" clears `data_utilizacao`
- Next calibration date recalculated

## Acceptance Criteria

- [ ] Updates instrument position to valid new value
- [ ] Creates MovimentacaoInstrumento record with old/new positions
- [ ] Records user who made the change
- [ ] Recalculates next calibration date for service-time instruments
- [ ] Returns success message with new position and instrument ID
- [ ] Returns 400 for invalid position value

## Backend Behavior

### Endpoints
- `PATCH /instrumentos/{id}/mudar_posicao/` — Change position

### Request Body
```json
{
  "nova_posicao": "E"
}
```

### Position Choices
| Code | Label |
|------|-------|
| U | Em uso (In Use) |
| E | Em estoque (In Stock) |
| I | Inativo (Inactive) |
| F | Fora de uso (Out of Service) |
| C | Em calibração (In Calibration) |

### Business Rules
- Only creates movement record if position actually changes
- For "Service Time" criterion:
  - Position → "In Use": Set `data_utilizacao` = today, calculate next calibration
  - Position → Other: Clear `data_utilizacao`, clear next calibration date
- For "Calendar Time" criterion: Position change does not affect dates

### Validations
- `nova_posicao` must be one of the valid choices (U, E, I, F, C)
- Instrument must exist

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Update (position, dates)
- `MovimentacaoInstrumento` — Create

### Permissions
- **Authenticated Users**: Can change position of own client's instruments
- **Staff Users**: Can change position of any instrument

## Edge Cases & Failures

### Validation Errors
- Invalid position code: Return 400 "Posição inválida"

### Missing Data
- Instrument not found: Return 404

### Permission Denied
- Changing another client's instrument (non-staff): Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Position change: instrument ID, old position, new position, user ID, timestamp
- Date recalculations logged when applicable

### Metrics
- Position changes by type (to/from each status)
- Most common position transitions
- Instruments time in each position

## Open Questions

- [ ] Should position changes trigger email notifications?
- [ ] Should there be restrictions on certain transitions (e.g., Inactive → In Use)?

