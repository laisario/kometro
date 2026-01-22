# Feature: Login

## Feature Summary

Login form for user authentication with email and password, storing JWT tokens for API access.

## User Value

### Problem Solved
Users need secure access to the system.

### Who Benefits
- **All Users**: System access

## Scope

### In Scope
- Email/password form
- JWT token storage
- Redirect after login
- Error handling

### Out of Scope
- Social login
- Remember me
- MFA

## User Flow

### Primary Flow
1. User enters email and password
2. User clicks Login
3. System validates credentials
4. System stores JWT tokens
5. Redirect to dashboard

### Alternate Flows

#### Invalid Credentials
- Show error message
- Clear password field

## Acceptance Criteria

- [ ] Email and password fields
- [ ] Submit button
- [ ] Error display
- [ ] Stores tokens in localStorage
- [ ] Redirects on success

## Frontend Behavior

### Screens/Components
- `LoginPage.jsx` — Login page
- `LoginForm.jsx` — Form component

### Key States
- **Initial**: Empty form
- **Submitting**: Loading state
- **Error**: Invalid credentials shown
- **Success**: Redirect

## Data & Permissions

### Entities Touched
- Auth API — Login

### Permissions
- **Public**: Login page

## Edge Cases & Failures

### Validation Errors
- Empty fields: Required message
- Invalid email: Format error

### Network/Integration Failures
- API error: Show error message

## Observability

### Logs/Events
- Login attempts

## Open Questions

- [ ] Should there be account lockout?

