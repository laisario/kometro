# Feature: Calibration Records

## Feature Summary

Tab/section within instrument details showing calibration history with ability to add new calibration records and view certificates.

## User Value

### Problem Solved
Users need to view complete calibration history and add new records when calibrations are performed.

### Who Benefits
- **Lab Technicians**: Record calibration work
- **Quality Managers**: Review calibration history
- **Auditors**: Verify calibration compliance

## Scope

### In Scope
- List calibration records
- View calibration details
- Add new calibration
- Record calibration results
- View/download certificates

### Out of Scope
- Certificate generation
- Calibration scheduling

## User Flow

### Primary Flow (View)
1. User opens instrument details
2. User views calibration tab
3. System shows calibration history

### Primary Flow (Add)
1. User clicks "Add Calibration"
2. User enters calibration details
3. User saves record
4. List refreshes with new record

### Alternate Flows

#### No Calibrations
- Show "Nenhuma calibração registrada"

## Acceptance Criteria

- [ ] Lists all calibrations for instrument
- [ ] Shows date, lab, service order, status
- [ ] Add calibration form works
- [ ] Results can be entered
- [ ] Certificate upload available

## Frontend Behavior

### Screens/Components
- `RecordList.jsx` — Calibration list
- `CalibrationCard.jsx` — Individual record
- `Certificates.jsx` — Certificate section

### Key States
- **Loading**: Spinner
- **Empty**: No records message
- **List**: Records displayed
- **Adding**: Form open

## Data & Permissions

### Entities Touched
- `Calibracao` — Read/Create
- `Certificado` — Read/Create

### Permissions
- **View**: All authenticated
- **Create**: Edit permission

## Edge Cases & Failures

### Missing Data
- No calibrations: Empty state

### Network/Integration Failures
- Load failure: Error message

## Observability

### Logs/Events
- Calibrations viewed/added

## Open Questions

- [ ] Should calibrations be editable?

