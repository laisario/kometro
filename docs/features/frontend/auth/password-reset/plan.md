# Feature: Password Reset

## Feature Summary

Two-page flow for password recovery: request page and reset page.

## User Value

### Problem Solved
Users who forget passwords need self-service recovery.

### Who Benefits
- **All Users**: Account recovery
- **Support Team**: Fewer tickets

## Scope

### In Scope
- Request reset page (email entry)
- Reset page (new password entry)
- Token validation
- Success feedback

### Out of Scope
- Security questions
- SMS verification

## User Flow

### Primary Flow (Request)
1. User clicks "Forgot Password"
2. User enters email
3. System sends reset email
4. Success message shown

### Primary Flow (Reset)
1. User clicks email link
2. Token validated
3. User enters new password
4. Password updated
5. Redirect to login

## Acceptance Criteria

- [ ] Email input on request page
- [ ] Generic success message (security)
- [ ] Token validated on reset page
- [ ] Password confirmation field
- [ ] Updates password successfully

## Frontend Behavior

### Screens/Components
- `ResetPasswordRequestPage.jsx` — Request form
- `ResetPasswordPage.jsx` — Reset form

### Key States
- **Initial**: Form displayed
- **Submitting**: API call
- **Success**: Message shown
- **Error**: Error displayed

## Data & Permissions

### Entities Touched
- Password reset APIs

### Permissions
- **Public**: Both pages

## Edge Cases & Failures

### Validation Errors
- Invalid email: Generic success (security)
- Passwords don't match: Show error

### Network/Integration Failures
- Email failure: Still show success (security)

## Observability

### Logs/Events
- Reset requests and completions

## Open Questions

- [ ] Should token expiration be shown?

