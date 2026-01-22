# Feature: Export Instruments

## Feature Summary

Dialog for selecting instruments and fields to export, generating a downloadable CSV file.

## User Value

### Problem Solved
Users need to extract instrument data for external reports, spreadsheets, and audit documentation.

### Who Benefits
- **Quality Managers**: Generate compliance reports
- **Administrators**: Export data for analysis
- **Auditors**: Receive instrument lists

## Scope

### In Scope
- Select instruments to export
- Choose fields to include
- Generate CSV download

### Out of Scope
- Excel format
- Scheduled exports
- Export templates

## User Flow

### Primary Flow
1. User selects instruments in table
2. User clicks "Export"
3. Dialog shows field selection
4. User checks desired fields
5. User clicks export
6. Browser downloads CSV

### Alternate Flows

#### No Selection
- Export all visible instruments

## Acceptance Criteria

- [ ] Shows available fields
- [ ] Exports only selected instruments
- [ ] Exports only selected fields
- [ ] Downloads as CSV
- [ ] Handles large exports

## Frontend Behavior

### Screens/Components
- `ExportFilter.jsx` — Export dialog

### Key States
- **Open**: Field selection shown
- **Exporting**: Processing
- **Complete**: Download triggered

### Export Fields
- Tag, Serial Number, Type, Model
- Manufacturer, Position, Sector
- Calibration dates, Expiration status

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read

### Permissions
- **All Authenticated Users**: Export accessible instruments

## Edge Cases & Failures

### Missing Data
- No selection: Export all or show message

### Network/Integration Failures
- Export failure: Error toast

## Observability

### Logs/Events
- Export triggered: count, fields

## Open Questions

- [ ] Should there be a limit on export size?

