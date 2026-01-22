# Feature: Verifications (Checagem)

## Feature Summary

Intermediate checks (verifications) are simplified calibration checks performed between formal calibrations. They use the same data structure as calibrations but are flagged with `checagem=true` and update different date fields on the instrument.

## User Value

### Problem Solved
Between full calibrations, instruments should be periodically checked to ensure they remain within acceptable limits. These verification records maintain the quality assurance trail without the full overhead of formal calibration.

### Who Benefits
- **Quality Managers**: Track intermediate quality checks
- **Operators**: Verify instruments are still reliable between calibrations
- **Auditors**: Review complete instrument verification history

## Scope

### In Scope
- Create verification records (checagem=true)
- List verification records separately from calibrations
- Update data_ultima_checagem and data_proxima_checagem
- Record verification results

### Out of Scope
- Different data structure for verifications
- Verification-specific certificates
- Automated verification scheduling

## User Flow

### Primary Flow
1. User performs physical instrument check
2. User navigates to instrument detail
3. User adds new verification
4. System creates Calibracao with checagem=true
5. System updates instrument check dates
6. User can view verification in separate tab/list

### Alternate Flows

#### Failed Verification
- Instrument fails check
- User records results showing failure
- Instrument may be flagged for immediate calibration

## Acceptance Criteria

- [ ] Creates Calibracao with checagem=true
- [ ] Updates data_ultima_checagem on instrument
- [ ] Recalculates data_proxima_checagem
- [ ] List endpoint filters by checagem parameter
- [ ] Uses separate serializers for verification records

## Backend Behavior

### Endpoints
- `GET /calibracoes/?instrumento=X&checagem=true` — List verifications
- `POST /calibracoes/` with `checagem: true` — Create verification

### Request Body
```json
{
  "instrumento": 123,
  "data": "2025-01-15",
  "checagem": true,
  "observacoes": "Verificação periódica OK"
}
```

### Business Rules
- `checagem` field distinguishes from formal calibrations
- Verifications update different date fields:
  - `data_ultima_checagem` instead of `data_ultima_calibracao`
  - `data_proxima_checagem` instead of `data_proxima_calibracao`
- Uses ChecagemReadSerializer / ChecagemWriteSerializer

### Validations
- Same as calibration validations
- `checagem` must be boolean true

## Data & Permissions

### Entities Touched
- `Calibracao` — Create/Read (with checagem=true)
- `InstrumentoDoCliente` — Update (checagem dates)

### Permissions
- **Authenticated Users**: Manage verifications for own instruments
- **Staff Users**: Manage verifications for any instrument

## Edge Cases & Failures

### Validation Errors
- Invalid checagem value: Defaults to false

### Missing Data
- Same as calibrations

### Permission Denied
- Same as calibrations

### Network/Integration Failures
- Same as calibrations

## Observability

### Logs/Events
- Verification created: instrument ID, date, user
- Check date recalculation logged

### Metrics
- Verifications vs calibrations ratio
- Verification frequency per instrument

## Open Questions

- [ ] Should verifications have a simplified form?
- [ ] Should failed verifications trigger alerts?
- [ ] Should verification results be mandatory?

