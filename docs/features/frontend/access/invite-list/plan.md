# Feature: Invite List

## Feature Summary

List of pending and used invitations for the organization.

## User Value

### Problem Solved
Administrators need to track invitation status.

### Who Benefits
- **Administrators**: Monitor invitation usage

## Scope

### In Scope
- List all invitations
- Show status (pending/used)
- Delete unused invitations
- Show role and date

### Out of Scope
- Resend invitations
- Edit invitations

## User Flow

### Primary Flow
1. Admin views invitation list
2. Sees pending and used invitations
3. Can delete unused invitations

## Acceptance Criteria

- [ ] Shows all invitations
- [ ] Status indicator
- [ ] Role and date shown
- [ ] Delete button for unused

## Frontend Behavior

### Screens/Components
- `InviteList.jsx` — Invitation table

### Key States
- **Loading**: Spinner
- **Loaded**: List displayed
- **Empty**: No invitations

## Data & Permissions

### Entities Touched
- `Convite` — Read/Delete

### Permissions
- **Admin Permission**: View and delete

## Edge Cases & Failures

### Missing Data
- No invitations: Empty message

## Observability

### Logs/Events
- Deletions logged

## Open Questions

- [ ] Should used invitations be archivable?

