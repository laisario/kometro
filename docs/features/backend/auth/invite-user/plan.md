# Feature: Invite User

## Feature Summary

Creates invitation links for new users to join an existing organization. Invitations include role assignment and expire after a set period.

## User Value

### Problem Solved
Organizations need to add team members without going through full registration. Invites ensure proper role assignment.

### Who Benefits
- **Administrators**: Add team members easily
- **New Team Members**: Simple onboarding

## Scope

### In Scope
- Generate invitation JWT token
- Create Convite record
- Track invitation status
- List pending invitations

### Out of Scope
- Email delivery (frontend handles sharing)
- Bulk invitations
- Invitation templates

## User Flow

### Primary Flow
1. Admin selects role for new user
2. Admin generates invitation
3. System creates token and record
4. Admin shares link with invitee
5. Invitee uses link to register

### Alternate Flows

#### Invitation Used
- Status updated to usado=true
- Link no longer valid

## Acceptance Criteria

- [ ] Generates unique JWT token
- [ ] Creates Convite record with grupo and cliente
- [ ] Returns shareable URL
- [ ] Token expires after 7 days
- [ ] Lists pending invitations

## Backend Behavior

### Endpoints
- `POST /invites/create/` — Create invitation
- `GET /convites/` — List invitations
- `DELETE /convites/{id}/` — Delete invitation

### Create Request
```json
{
  "grupo": 1,
  "cliente": 1
}
```

### Response
```json
{
  "convite_url": "https://app.kometro.com.br/#/register/invite/{token}",
  "convite": {
    "id": 1,
    "grupo": {"id": 1, "name": "Viewer"},
    "criado_por": "admin",
    "criado_em": "2025-01-15T10:00:00Z",
    "usado": false
  }
}
```

### Token Payload
```json
{
  "jti": "uuid",
  "grupo_id": 1,
  "cliente_id": 1,
  "criado_por": 1,
  "type": "invite",
  "exp": "7 days from now"
}
```

### Business Rules
- JTI stored for validation
- Token signed with SECRET_KEY
- 7-day expiration
- usado flag tracks completion

### Validations
- grupo and cliente required
- User must have permission

## Data & Permissions

### Entities Touched
- `Convite` — Create/Read/Delete
- `Group` — Read

### Permissions
- **NivelPermission**: Role-based access

## Edge Cases & Failures

### Validation Errors
- Missing fields: Return 400

### Missing Data
- Invalid group/client: Return 400

## Observability

### Logs/Events
- Invitation created: grupo, client, creator

### Metrics
- Invitations sent vs used

## Open Questions

- [ ] Should invitation emails be sent automatically?
- [ ] Should unused invitations be cleaned up?

