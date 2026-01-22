# Feature: Calibration Panel

## Feature Summary

Staff interface for managing calibrations across a client's instruments, including recording calibrations and viewing history.

## User Value

### Problem Solved
Lab staff needs efficient calibration recording for client instruments.

### Who Benefits
- **Lab Technicians**: Record calibrations efficiently
- **Quality Managers**: Track calibration work

## Scope

### In Scope
- View client instruments
- Record calibrations
- View calibration status
- Upload certificates

### Out of Scope
- Batch calibration recording
- Calibration scheduling

## User Flow

### Primary Flow
1. Staff opens client details
2. Staff opens calibration panel
3. Staff selects instrument
4. Staff records calibration
5. Certificate uploaded

## Acceptance Criteria

- [ ] Shows instruments needing calibration
- [ ] Quick calibration recording
- [ ] Certificate upload
- [ ] Updates instrument dates

## Frontend Behavior

### Screens/Components
- `CalibrationPanel.jsx` — Panel container
- `Calibration.jsx` — Calibration form
- `Calibrations.jsx` — History list

### Key States
- **Viewing**: Instrument list
- **Recording**: Calibration form
- **Uploading**: Certificate upload

## Data & Permissions

### Entities Touched
- `Calibracao` — Create
- `Certificado` — Create

### Permissions
- **Staff Only**: Access panel

## Edge Cases & Failures

### Validation Errors
- Missing data: Show errors

## Observability

### Logs/Events
- Calibrations recorded

## Open Questions

- [ ] Should there be batch recording?

