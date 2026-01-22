# Feature: Instrument Details

## Feature Summary

Displays complete information about a specific instrument including specifications, calibration history, certificates, and acceptance criteria. Provides actions for editing, position changes, and recording calibrations.

## User Value

### Problem Solved
Users need comprehensive information about an instrument in one place to manage its lifecycle, review history, and perform actions.

### Who Benefits
- **Quality Managers**: Review complete instrument profile
- **Lab Technicians**: Access calibration history and certificates
- **Auditors**: Review instrument documentation

## Scope

### In Scope
- Instrument specifications display
- Calibration history list
- Certificate display and download
- Position change action
- Critical analysis recording
- Movement history
- Acceptance criteria display

### Out of Scope
- Instrument comparison
- Predictive maintenance

## User Flow

### Primary Flow
1. User clicks instrument from list
2. System loads instrument details
3. User views information cards
4. User can trigger actions (edit, calibration, position)

### Alternate Flows

#### No Calibrations
- Show "Nenhuma calibração registrada"

#### Loading Error
- Show error message with back button

## Acceptance Criteria

- [ ] Shows instrument header with tag and type
- [ ] Displays position with change button
- [ ] Shows calibration history tab
- [ ] Shows certificates with download links
- [ ] Shows acceptance criteria
- [ ] Edit button opens edit form
- [ ] Can add new calibration
- [ ] Can perform critical analysis

## Frontend Behavior

### Screens/Components
- `InstrumentoDetailPage.jsx` — Main page
- `InstrumentDetails.jsx` — Information cards
- `InstrumentPosition.jsx` — Position with change action
- `CalibrationCard.jsx` — Calibration record display
- `Certificates.jsx` — Certificate list and upload
- `CriticalAnalysisDialog.jsx` — Analysis form
- `RecordList.jsx` — History display
- `InstrumentMovimentations.jsx` — Movement history

### Key States
- **Loading**: Skeleton loaders
- **Loaded**: Full information display
- **Error**: Error message with retry
- **Editing**: Edit form overlay

### Form Validations
- Position change: Valid position selection
- Critical analysis: Required status selection

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read
- `Calibracao` — Read
- `Certificado` — Read
- `MovimentacaoInstrumento` — Read

### Permissions
- **All Authenticated Users**: View details
- **Edit Permissions**: Modify instruments

## Edge Cases & Failures

### Validation Errors
- Invalid position: Show field error

### Missing Data
- Instrument not found: 404 page

### Permission Denied
- Not owner: Redirect or error

### Network/Integration Failures
- API error: Error state with retry

## Observability

### Logs/Events
- Detail page views
- Actions taken

### Metrics
- Time spent on detail pages
- Actions per view

## Open Questions

- [ ] Should there be a print view?
- [ ] Should changes be tracked in-page?

