# Feature: Register Invite

## Feature Summary

Simplified registration form for users invited via invitation link, pre-associated with an organization.

## User Value

### Problem Solved
Team members need easy onboarding without full registration.

### Who Benefits
- **New Team Members**: Quick setup
- **Administrators**: Controlled onboarding

## Scope

### In Scope
- Validate invitation token
- Simplified registration form
- Auto-association with organization

### Out of Scope
- Company setup
- Role selection

## User Flow

### Primary Flow
1. User clicks invitation link
2. System validates token
3. User enters name, email, password
4. System creates user
5. User can login

### Alternate Flows

#### Invalid Token
- Show error message
- Link to standard registration

#### Used Token
- Show "already used" message

## Acceptance Criteria

- [ ] Validates token on load
- [ ] Shows error for invalid/expired token
- [ ] Name, email, password fields
- [ ] Creates user on submit
- [ ] Redirects to login

## Frontend Behavior

### Screens/Components
- `ResgisterFromInvite.jsx` — Invite registration

### Key States
- **Validating**: Checking token
- **Valid**: Form shown
- **Invalid**: Error shown
- **Submitting**: Creating user
- **Complete**: Success

## Data & Permissions

### Entities Touched
- Invite registration API

### Permissions
- **Public**: With valid token

## Edge Cases & Failures

### Validation Errors
- Duplicate email: Show error

### Network/Integration Failures
- Token validation failure

## Observability

### Logs/Events
- Invite completions

## Open Questions

- [ ] Should there be a welcome tutorial?

