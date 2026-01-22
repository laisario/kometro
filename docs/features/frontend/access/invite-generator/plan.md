# Feature: Invite Generator

## Feature Summary

Form for creating new user invitations with role selection.

## User Value

### Problem Solved
Administrators need to invite team members with appropriate roles.

### Who Benefits
- **Administrators**: Easy invitation creation

## Scope

### In Scope
- Role selection
- Generate invitation link
- Copy to clipboard

### Out of Scope
- Email sending
- Bulk invitations

## User Flow

### Primary Flow
1. Admin selects role
2. Admin clicks "Generate"
3. System creates invitation
4. Link displayed for copying

## Acceptance Criteria

- [ ] Role dropdown
- [ ] Generate button
- [ ] Shows generated URL
- [ ] Copy to clipboard button

## Frontend Behavior

### Screens/Components
- `InviteGenerator.jsx` — Generator form

### Key States
- **Ready**: Form shown
- **Generating**: API call
- **Generated**: Link shown

## Data & Permissions

### Entities Touched
- `Convite` — Create

### Permissions
- **Admin Permission**: Create invitations

## Edge Cases & Failures

### Validation Errors
- No role selected: Required

## Observability

### Logs/Events
- Invitations created

## Open Questions

- [ ] Should expiration be shown?

