# Feature: Instrument Position

## Feature Summary

Component and action for viewing and changing an instrument's operational position (In Use, In Stock, In Calibration, etc.).

## User Value

### Problem Solved
Instrument positions change frequently and need quick, easy updates with proper tracking.

### Who Benefits
- **Lab Technicians**: Mark instruments for calibration
- **Quality Managers**: Track instrument availability
- **Maintenance**: Monitor equipment status

## Scope

### In Scope
- Display current position with badge
- Quick position change action
- Movement recorded in history

### Out of Scope
- Bulk position changes
- Approval workflow

## User Flow

### Primary Flow
1. User views instrument position badge
2. User clicks position or change icon
3. Dropdown shows position options
4. User selects new position
5. System updates position
6. Badge updates to reflect change

### Alternate Flows

#### Same Position Selected
- No API call
- No change recorded

## Acceptance Criteria

- [ ] Shows current position with color-coded badge
- [ ] Dropdown shows all valid positions
- [ ] Successful change updates badge immediately
- [ ] Movement recorded in history
- [ ] Error shown if update fails

## Frontend Behavior

### Screens/Components
- `InstrumentPosition.jsx` — Position display and change control

### Key States
- **Displaying**: Shows current position
- **Selecting**: Dropdown open
- **Updating**: Saving change
- **Updated**: New position shown

### Position Options
| Code | Label | Color |
|------|-------|-------|
| U | Em uso | Green |
| E | Em estoque | Blue |
| I | Inativo | Gray |
| F | Fora de uso | Red |
| C | Em calibração | Orange |

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Update
- `MovimentacaoInstrumento` — Create (backend)

### Permissions
- **Edit Permission**: Required for change

## Edge Cases & Failures

### Validation Errors
- Invalid position: Should not be possible via UI

### Permission Denied
- No edit: Change disabled

### Network/Integration Failures
- API error: Show error, revert badge

## Observability

### Logs/Events
- Position changes logged

## Open Questions

- [ ] Should certain transitions require confirmation?

