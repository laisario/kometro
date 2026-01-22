# Feature: Create Calibration

## Feature Summary

Records a new calibration or verification event for an instrument. Updates the instrument's last calibration date and triggers recalculation of the next calibration date. Supports recording results, service order, and performing laboratory.

## User Value

### Problem Solved
After an instrument is calibrated, the event must be recorded to maintain the calibration history, update compliance status, and calculate when the next calibration is due.

### Who Benefits
- **Lab Technicians**: Record calibration work performed
- **Quality Managers**: Maintain complete calibration history
- **Clients**: Track when instruments were last calibrated

## Scope

### In Scope
- Create calibration record with date and details
- Update instrument's last calibration/check date
- Trigger next calibration date recalculation
- Record calibration results
- Associate with service order

### Out of Scope
- Automatic certificate generation
- Certificate upload (separate action)
- Batch calibration entry

## User Flow

### Primary Flow
1. User opens instrument detail
2. User clicks "Add Calibration"
3. User enters calibration date, service order, lab
4. User optionally enters results (error, uncertainty)
5. System creates calibration record
6. System updates instrument dates
7. System returns created calibration

### Alternate Flows

#### Verification (Checagem)
- User marks as verification instead of calibration
- System updates data_ultima_checagem instead
- System recalculates data_proxima_checagem

## Acceptance Criteria

- [ ] Creates calibration record with provided data
- [ ] Updates instrument's data_ultima_calibracao (or data_ultima_checagem)
- [ ] Triggers date recalculation on instrument
- [ ] Stores calibration sector from instrument's current sector
- [ ] Returns created calibration with 201 status
- [ ] Handles checagem parameter for verification records

## Backend Behavior

### Endpoints
- `POST /calibracoes/` — Create calibration

### Request Body
```json
{
  "instrumento": 123,
  "data": "2025-01-15",
  "ordem_de_servico": "OS-2025-001",
  "laboratorio": "Lab XYZ",
  "checagem": false,
  "observacoes": "Calibração realizada conforme procedimento",
  "local": "P",
  "preco": 150.00
}
```

### Business Rules
- `checagem` boolean determines calibration vs verification
- Calibration automatically copies instrument's current sector
- Saving calibration triggers instrument date updates:
  - If checagem: updates data_ultima_checagem
  - If not checagem: updates data_ultima_calibracao
- Date recalculation follows frequency criterion (calendar vs service)

### Validations
- `instrumento` — Required, must exist
- `data` — Optional (can be added later)
- `checagem` — Boolean, defaults to false

## Data & Permissions

### Entities Touched
- `Calibracao` — Create
- `InstrumentoDoCliente` — Update (dates)

### Permissions
- **Authenticated Users**: Create for own client's instruments
- **Staff Users**: Create for any instrument

## Edge Cases & Failures

### Validation Errors
- Invalid instrument ID: Return 400
- Invalid date format: Return 400

### Missing Data
- Instrument not found: Return 400

### Permission Denied
- Creating for another client's instrument (non-staff): Return 403

### Network/Integration Failures
- Transaction failure: Rollback, return 500

## Observability

### Logs/Events
- Calibration created: instrument ID, date, user
- Date recalculation triggered

### Metrics
- Calibrations created per day
- Calibrations vs verifications ratio

## Open Questions

- [ ] Should calibration creation notify quality managers?
- [ ] Should future-dated calibrations be allowed?

