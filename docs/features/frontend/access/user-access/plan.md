# Feature: User Access

## Feature Summary

Page for managing user invitations and access within an organization.

## User Value

### Problem Solved
Administrators need to control who has access to the organization.

### Who Benefits
- **Administrators**: Manage team access
- **Security**: Control access

## Scope

### In Scope
- View pending invitations
- Create new invitations
- Delete unused invitations

### Out of Scope
- User management
- Role editing
- Deactivating users

## User Flow

### Primary Flow
1. Admin navigates to Access page
2. Views pending invitations
3. Creates new invitation
4. Shares invitation link

## Acceptance Criteria

- [ ] Shows pending invitations
- [ ] Create invitation button
- [ ] Copy invitation link
- [ ] Delete invitation

## Frontend Behavior

### Screens/Components
- `UserAccessPage.jsx` — Main page
- `InviteGenerator.jsx` — Create form
- `InviteList.jsx` — Invitation list

### Key States
- **Loading**: Fetching invites
- **Loaded**: List displayed
- **Creating**: New invite form

## Data & Permissions

### Entities Touched
- `Convite` — CRUD

### Permissions
- **Admin Permission**: Access page

## Edge Cases & Failures

### Missing Data
- No invitations: Empty state

## Observability

### Logs/Events
- Invitation management logged

## Open Questions

- [ ] Should there be user listing?

