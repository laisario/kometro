# Feature: Manage Client Users

## Feature Summary

Add the ability to remove existing users from a client and invite new users via the existing invitation system. **Removing a user from a client DELETES the user from the system entirely.** This is an irreversible action.

## User Value

### Problem Solved
Team administrators need to manage user access to clients - removing access when employees leave and granting access to new team members.

### Who Benefits
- **Team Managers**: Remove/revoke access when employees leave
- **Administrators**: Invite new users via link

## Scope

### In Scope
- Remove user from client (deletes user permanently)
- Confirm before removing access
- Invite new user via existing invitation URL
- Copy invitation link to clipboard

### Out of Scope
- Direct user creation from admin
- Bulk user operations

## Current Behavior Summary

### Backend
- `Cliente.usuarios` is a ManyToManyField to User
- Invitation system: `CriarConviteView` creates invite tokens
- Invite includes `cliente_id` in JWT payload
- On registration: `RegistroDoConviteView` links user to client via `cliente.usuarios.add(user)`

### Frontend
- `ClientInformation.jsx` displays users card with name, email, groups/chips
- Users displayed in scrollable list

## User Flow

### Remove User
1. Admin views client details
2. Admin sees users card with list of users
3. Admin clicks "Remover" on a user
4. System shows confirmation dialog
5. Admin confirms
6. System removes user from client.usuarios
7. Refresh user list

### Invite New User
1. Admin clicks "Convidar" in users card
2. System generates invite URL via `POST /invites/create/`
3. Admin copies/shares invite link
4. New user registers via link
5. New user auto-linked to client

## Acceptance Criteria

- [ ] Remove button visible for each user in client users widget
- [ ] Confirmation dialog shows before removing
- [ ] Removing deletes user from system (irreversible)
- [ ] Invite button generates valid invitation URL
- [ ] Invitation URL can be copied to clipboard
- [ ] Invited user is linked to client on registration
- [ ] Group is assigned based on invitation (gerente/registrador/observador)

## Backend Behavior

### Endpoints

#### Remove User from Client
- `DELETE /clientes/{cliente_id}/usuarios/{user_id}/` — Remove user from client

#### Invite User
- Existing endpoint: `POST /invites/create/`
- Request:
```json
{
  "grupo": 1,
  "cliente": 5
}
```
- Response:
```json
{
  "convite_url": "https://site/#/register/invite/{token}",
  "convite": { ... }
}
```

### Business Rules
- Remove: **Deletes user from system entirely** — user account is permanently removed
- Remove: User must be deleted, not just unlinked
- Invite: Requires `grupo` (gerente=1, registrador=2, observador=3)
- Invite: 7-day expiration

### Validations
- Remove: User must be linked to this client
- Remove: Cannot remove self (prevent lockout)
- Invite: Must provide valid grupo_id
- Invite: Must provide valid cliente_id
- Invite: Staff only

### Permissions
- **Staff Only**: Remove users, generate invites
- **NivelPermission**: Required for both actions

## Frontend Behavior

### Remove User Flow

#### UI Components
- Users card in `ClientInformation.jsx`
- Add remove button per user
- Confirmation dialog (MUI Dialog)

#### Key States
- **Initial**: User list displayed
- **Confirming**: Dialog open
- **Removing**: Button shows loading
- **Removed**: List refreshes, snackbar confirmation
- **Error**: Error snackbar displayed

#### Confirmation Dialog Content
```
  Título: "Excluir usuário {username}?"
  Conteúdo: "Isso excluirá permanentemente {username} do sistema. 
            Esta ação é IRREVERSÍVEL. O usuário não poderá mais acessar o sistema."
  Botões: "Cancelar" | "Excluir"
```

### Invite User Flow

#### UI Components
- "Convidar" button in users card header
- Dialog to select group
- Copy button for invite URL
- Optional: "Copiar link" button

#### Key States
- **Initial**: Button visible
- **Generating**: Loading indicator
- **Generated**: URL displayed with copy button
- **Copied**: "Link copiado!" snackbar
- **Error**: Error snackbar

## Data & Permissions

### Entities Touched
- `Cliente.usuarios` — Remove M2M relationship
- `Convite` — Create new invitation
- `User` — Read existing for removal

### Permissions
- **Staff Only**: Remove users from client
- **Staff Only**: Generate invites

## Edge Cases & Failures

### Remove User
- User not linked to client: Return 404, show error
- Cannot remove self: Return 400 "Não é possível remover seu próprio acesso"
- Remove last user: Allow (client can have no users)
- Deletion is permanent: No soft delete, user record is removed

### Invite User
- Invalid grupo: Return error
- Invalid cliente: Return error
- Non-staff: Return 403

### Registration
- Expired token: Show "Convite expirado"
- Already used: Show "Convite já utilizado"
- Invalid token: Show "Token inválido"

## Implementation Checklist

### Backend
- [ ] Create endpoint: DELETE /clientes/{id}/usuarios/{user_id}/
- [ ] Add permission check (staff only)
- [ ] Validate user is linked to this client
- [ ] Prevent self-removal
- [ ] Delete user entirely (not just unlink from M2M)
- [ ] Write tests: Remove user deletes user from system
- [ ] Write tests: Cannot remove self
- [ ] Write tests: Verify user is actually deleted from database

### Frontend
- [ ] Add remove button to each user in ClientInformation
- [ ] Add confirmation Dialog for remove
- [ ] Add invite button to users card header
- [ ] Add invite dialog with group selection
- [ ] Add copy to clipboard functionality
- [ ] Handle loading/error/success states
- [ ] Write tests: Remove user flow
- [ ] Write tests: Invite flow

## Existing Invite System Reference

### Backend Flow

1. Admin calls `POST /invites/create/` with grupo_id + cliente_id
2. System creates JWT with: jti, grupo_id, criado_por, cliente_id, type, expiration
3. Returns invite_url: `site/#/register/invite/{token}`

### Registration Flow

1. New user visits invite link
2. User submits registration form
3. `RegistroDoConviteView`:
   - Validates JWT
   - Creates User
   - Adds user to group
   - Links user to client: `cliente.usuarios.add(user)`
   - Marks invite as used

### Groups Reference
- gerente (id=1): Full access
- registrador (id=2): Can register instruments
- observador (id=3): Read-only access