# Feature: Edit Instrument

## Feature Summary

Form for modifying existing instrument details including tag, sector, frequencies, and acceptance criteria. Pre-populated with current values.

## User Value

### Problem Solved
Instrument details change over time and need to be updated to maintain accurate records.

### Who Benefits
- **Quality Managers**: Update instrument configurations
- **Administrators**: Correct data entry errors

## Scope

### In Scope
- Edit all mutable fields
- Maintain existing calibration history
- Update acceptance criteria
- Change sector assignment

### Out of Scope
- Changing instrument type
- Changing owning client
- Editing calibration records

## User Flow

### Primary Flow
1. User opens instrument detail page
2. User clicks "Edit"
3. Form opens with current values
4. User modifies fields
5. User saves changes
6. Page refreshes with updated data

### Alternate Flows

#### Cancel Edit
- Form closes without saving
- Original values preserved

## Acceptance Criteria

- [ ] Pre-populates all fields with current values
- [ ] Validates tag uniqueness if changed
- [ ] Sector selection shows full hierarchy
- [ ] Acceptance criteria editable
- [ ] Cancel discards changes
- [ ] Save updates and refreshes view

## Frontend Behavior

### Screens/Components
- `EditAsset.jsx` — Edit form container
- Uses same form components as create

### Key States
- **Loading**: Fetching current data
- **Editing**: Form with values
- **Submitting**: Saving changes
- **Success**: Close form, refresh
- **Error**: Show errors

### Form Validations
- Same as create, but considers existing values
- Tag uniqueness checked only if changed

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read/Update

### Permissions
- **Edit Permission**: Required

## Edge Cases & Failures

### Validation Errors
- Tag conflict: Show error

### Missing Data
- Instrument deleted: Error message

### Permission Denied
- No edit permission: Button hidden

### Network/Integration Failures
- Save failure: Error toast

## Observability

### Logs/Events
- Edit attempts and results

## Open Questions

- [ ] Should there be change history display?

