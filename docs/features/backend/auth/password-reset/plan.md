# Feature: Password Reset

## Feature Summary

Two-step password reset flow: request reset link via email, then set new password using the link's token.

## User Value

### Problem Solved
Users who forget their passwords need a secure way to regain access without admin intervention.

### Who Benefits
- **All Users**: Self-service password recovery
- **Support Team**: Reduced password reset tickets

## Scope

### In Scope
- Request reset link
- Send email with token
- Validate token
- Set new password

### Out of Scope
- Security questions
- SMS verification
- Password history

## User Flow

### Primary Flow (Request)
1. User clicks "Forgot Password"
2. User enters email
3. System generates token
4. System sends email (async)
5. User receives email with link

### Primary Flow (Reset)
1. User clicks link in email
2. User enters new password
3. System validates token
4. System updates password
5. User can login

### Alternate Flows

#### Email Not Found
- Same response (security)
- No email sent

## Acceptance Criteria

- [ ] Request accepts email, returns generic success
- [ ] Email sent only if user exists
- [ ] Token is unique and single-use
- [ ] Reset validates token
- [ ] Password updated successfully
- [ ] Token deleted after use

## Backend Behavior

### Endpoints
- `POST /reset-password-request/` — Request reset
- `POST /reset-password/{token}/` — Complete reset

### Request (Request Step)
```json
{
  "email": "user@example.com"
}
```

### Request (Reset Step)
```json
{
  "new_password": "NewSecurePassword123",
  "confirm_password": "NewSecurePassword123"
}
```

### Response (Both)
Generic success message (security)

### Business Rules
- Uses Django's PasswordResetTokenGenerator
- Token stored in PasswordReset model
- Email sent via Celery task
- Passwords must match
- Token deleted after successful reset

### Validations
- Email format valid
- Passwords must match
- Token must be valid

## Data & Permissions

### Entities Touched
- `PasswordReset` — Create/Read/Delete
- `User` — Read/Update

### Permissions
- **Public**: Both endpoints public

## Edge Cases & Failures

### Validation Errors
- Passwords don't match: Return 400
- Invalid token: Return 400

### Missing Data
- Email not found: Silent success (security)
- Token not found: Return 400

### Network/Integration Failures
- Email failure: Logged, no user impact

## Observability

### Logs/Events
- Reset requested: email (masked)
- Reset completed: email (masked)

### Metrics
- Reset requests vs completions

## Open Questions

- [ ] Should token expiration be enforced?
- [ ] Should account be locked after multiple resets?

