# Feature: Critical Analysis

## Feature Summary

Dialog for performing and recording critical analysis of calibration results — marking calibrations as approved, rejected, or approved with restrictions.

## User Value

### Problem Solved
After receiving calibration results, clients must evaluate if the instrument meets their requirements and record this decision.

### Who Benefits
- **Quality Managers**: Record analysis decisions
- **Auditors**: Verify analysis was performed

## Scope

### In Scope
- Analysis status selection
- Restriction notes entry
- Save analysis decision

### Out of Scope
- Automatic analysis based on criteria
- Analysis workflow/approval

## User Flow

### Primary Flow
1. User views calibration
2. User clicks "Critical Analysis"
3. Dialog opens with options
4. User selects status
5. User adds notes if restriction
6. User saves decision

## Acceptance Criteria

- [ ] Shows analysis options (Approved, Rejected, Restricted)
- [ ] Restriction notes field when "Restricted" selected
- [ ] Saves to calibration record
- [ ] Updates display after save

## Frontend Behavior

### Screens/Components
- `CriticalAnalysisDialog.jsx` — Analysis dialog

### Key States
- **Open**: Dialog visible
- **Selecting**: Status being chosen
- **Saving**: API call
- **Saved**: Success, close

### Analysis Options
| Code | Label |
|------|-------|
| A | Aprovado |
| X | Reprovado |
| R | Aprovado com restrição |
| P | Pendente |

## Data & Permissions

### Entities Touched
- `Calibracao` — Update (analise_critica)

### Permissions
- **Edit Permission**: Required

## Edge Cases & Failures

### Validation Errors
- Missing restriction notes: Required for restricted

### Network/Integration Failures
- Save failure: Error message

## Observability

### Logs/Events
- Analysis decisions logged

## Open Questions

- [ ] Should analysis changes be tracked?

