# Feature: Register from Invite

## Feature Summary

Completes registration for users invited via invitation link. Validates token, creates user account, assigns to group and client.

## User Value

### Problem Solved
Invited users need a streamlined registration that automatically associates them with the correct organization and role.

### Who Benefits
- **New Team Members**: Quick onboarding
- **Administrators**: Ensured proper access setup

## Scope

### In Scope
- Validate invitation token
- Create user account
- Assign to group from token
- Associate with client from token
- Mark invitation as used

### Out of Scope
- Terms acceptance
- Profile completion
- Welcome email

## User Flow

### Primary Flow
1. User receives invitation link
2. User clicks link and lands on registration form
3. User enters name, email, password
4. System validates token
5. System creates user with role
6. System marks invite as used
7. User can login

### Alternate Flows

#### Expired Token
- Return error: "Convite expirado"

#### Used Token
- Return error: "Convite já utilizado"

## Acceptance Criteria

- [ ] Validates JWT token signature
- [ ] Checks token not expired
- [ ] Checks invitation not used
- [ ] Creates user with provided credentials
- [ ] Assigns user to group from token
- [ ] Associates user with client from token
- [ ] Marks invitation as used
- [ ] Returns success message

## Backend Behavior

### Endpoints
- `POST /invites/register/{token}/` — Complete invite registration

### Request Body
```json
{
  "first_name": "John",
  "username": "john@example.com",
  "password": "SecurePassword123"
}
```

### Response
```json
{
  "success": "Usuário criado com sucesso"
}
```

### Business Rules
- Token decoded and validated
- JTI matched against Convite record
- User created with provided credentials
- Group assigned via user.groups.add()
- Client associated via cliente.usuarios.add()
- Convite.usado set to True

### Validations
- Token must be valid and unexpired
- Convite must exist and not be used
- All fields (first_name, username, password) required
- Username must be unique

## Data & Permissions

### Entities Touched
- `Convite` — Read/Update
- `User` — Create
- `Group` — Read
- `Cliente` — Update (add user)

### Permissions
- **Public**: Endpoint is public (token validates access)

## Edge Cases & Failures

### Validation Errors
- Missing fields: Return 400
- Duplicate username: Return 400

### Missing Data
- Convite not found: Return 404
- Invalid token: Return 400

### Permission Denied
- Expired token: Return 400
- Used invitation: Return 400

## Observability

### Logs/Events
- Invite registration: email, client, group

### Metrics
- Invite completion rate

## Open Questions

- [ ] Should password strength be enforced?
- [ ] Should welcome email be sent?

