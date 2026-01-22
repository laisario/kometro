# Feature: Create Instrument

## Feature Summary

Multi-step form for registering a new instrument with type selection, specifications, calibration settings, and optional acceptance criteria.

## User Value

### Problem Solved
Users need to add new instruments to the system with all required configuration for tracking and calibration management.

### Who Benefits
- **Quality Managers**: Onboard new instruments
- **Administrators**: Set up instrument catalog

## Scope

### In Scope
- Instrument type selection with search
- Tag and serial number entry
- Sector assignment
- Calibration frequency configuration
- Position selection
- Acceptance criteria entry

### Out of Scope
- Bulk creation
- Import from spreadsheet (separate feature)
- Template-based creation

## User Flow

### Primary Flow
1. User clicks "Add Instrument"
2. User searches and selects instrument type
3. User enters tag and optional serial number
4. User selects sector
5. User sets calibration frequency
6. User sets initial position
7. User optionally adds acceptance criteria
8. User saves instrument

### Alternate Flows

#### Duplicate Tag
- Show validation error
- User must change tag

#### Missing Required Fields
- Highlight missing fields
- Block submission

## Acceptance Criteria

- [ ] Searchable instrument type selector
- [ ] Tag uniqueness validated
- [ ] Sector selector shows client hierarchy
- [ ] Frequency selector shows available options
- [ ] Position defaults to appropriate value
- [ ] Acceptance criteria is optional
- [ ] Form validates before submission
- [ ] Redirects to detail page on success

## Frontend Behavior

### Screens/Components
- `CreateInstrument.jsx` — Form container
- `VirtualizedInstrumentAutocomplete.jsx` — Type search/select
- `FormDefaultAsset.jsx` — Form fields
- `CriteriosDeAceitacao.jsx` — Acceptance criteria fields

### Key States
- **Initial**: Empty form
- **Filling**: Partial data entered
- **Validating**: Checking unique tag
- **Submitting**: Saving data
- **Success**: Redirect to detail
- **Error**: Show validation errors

### Form Validations
- `tag` — Required, unique per client
- `instrumento` — Required (type selection)
- `setor` — Required
- `frequencia_calibracao` — Optional but recommended
- `posicao` — Required, defaults to "In Use"

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Create
- `Instrumento` — Read (type list)
- `Setor` — Read (hierarchy)
- `Frequencia` — Read (options)

### Permissions
- **Create Permission**: Required to access form

## Edge Cases & Failures

### Validation Errors
- Duplicate tag: Inline error message
- Invalid type: Selection required

### Missing Data
- No instrument types: Error message

### Permission Denied
- No create permission: Form disabled or hidden

### Network/Integration Failures
- Save failure: Error toast with retry

## Observability

### Logs/Events
- Form open, submission attempt, success/failure

### Metrics
- Form completion rate
- Common validation errors

## Open Questions

- [ ] Should there be a draft save feature?
- [ ] Should acceptance criteria be mandatory for certain types?

