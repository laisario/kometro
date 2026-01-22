# Feature: Login

## Feature Summary

Authenticates users with email/password and returns JWT tokens for API access. Returns user profile information along with access and refresh tokens.

## User Value

### Problem Solved
Users need secure access to the system with industry-standard authentication.

### Who Benefits
- **All Users**: Secure system access
- **Security Team**: Token-based authentication

## Scope

### In Scope
- Username/password authentication
- JWT access token generation
- JWT refresh token generation
- User profile in response

### Out of Scope
- Social login
- Multi-factor authentication
- Session management

## User Flow

### Primary Flow
1. User enters credentials
2. System validates credentials
3. System generates JWT tokens
4. User receives tokens and profile
5. Frontend stores tokens

### Alternate Flows

#### Invalid Credentials
- Return 401 Unauthorized

## Acceptance Criteria

- [ ] Accepts username and password
- [ ] Returns access and refresh JWT tokens
- [ ] Returns user profile information
- [ ] Returns 401 for invalid credentials

## Backend Behavior

### Endpoints
- `POST /login/` — Authenticate user

### Request Body
```json
{
  "username": "user@example.com",
  "password": "secretpassword"
}
```

### Response
```json
{
  "access": "eyJ0...",
  "refresh": "eyJ1...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "first_name": "John",
    "is_staff": false,
    ...
  }
}
```

### Business Rules
- Uses SimpleJWT TokenObtainPairView
- Custom LoginSerializer extends with user data
- Access token short-lived, refresh token long-lived

### Validations
- Username and password required
- Credentials must be valid

## Data & Permissions

### Entities Touched
- `User` — Read (authentication)

### Permissions
- **Public**: Login endpoint is public

## Edge Cases & Failures

### Validation Errors
- Missing fields: Return 400

### Missing Data
- User not found: Return 401 (same as wrong password)

### Permission Denied
- Inactive user: Return 401

## Observability

### Logs/Events
- Login success/failure: username, IP, timestamp
- Failed attempts tracked

### Metrics
- Login attempts per day
- Failure rate

## Open Questions

- [ ] Should account lockout be implemented?
- [ ] Should login location be tracked?

