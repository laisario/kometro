# Feature: Preferences Form

## Feature Summary

Form for setting client-level preferences such as default calibration frequency criterion (Calendar vs Service time).

## User Value

### Problem Solved
Organizations have different calibration tracking needs. Preferences allow customization per organization.

### Who Benefits
- **Quality Managers**: Set organizational standards
- **Administrators**: Configure client defaults

## Scope

### In Scope
- Frequency criterion selection
- Save preferences

### Out of Scope
- User-level preferences
- Notification preferences

## User Flow

### Primary Flow
1. User opens preferences
2. User selects frequency criterion
3. User saves changes
4. Future instruments use new default

## Acceptance Criteria

- [ ] Shows current preference
- [ ] Radio/dropdown for criterion
- [ ] Saves to backend
- [ ] Confirmation on save

## Frontend Behavior

### Screens/Components
- `PreferencesForm.jsx` — Settings form

### Key States
- **Loaded**: Current settings shown
- **Changed**: Unsaved changes
- **Saving**: API call
- **Saved**: Success message

### Criterion Options
- Calendar Time (fixed intervals)
- Service Time (usage-based)

## Data & Permissions

### Entities Touched
- `Cliente` — Read/Update

### Permissions
- **Admin Permission**: Required to change

## Edge Cases & Failures

### Validation Errors
- Invalid selection: Should not be possible

### Network/Integration Failures
- Save failure: Error message

## Observability

### Logs/Events
- Preference changes logged

## Open Questions

- [ ] Should there be more preferences?

