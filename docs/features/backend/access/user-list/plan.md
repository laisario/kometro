# Feature: User List on Access Page - Backend

## Feature Summary

The `/acessos` page frontend needs to display users. This plan covers backend requirements.

## Current Backend Endpoints

### Existing Endpoints (Sufficient)

1. **List Staff Users**
   - `GET /usuarios-admin/?is_staff=true`
   - Returns all staff users
   - Requires authentication

2. **Get Client with Users**
   - `GET /clientes/{id}/`
   - Returns client data including `usuarios` array
   - Each user has: id, username, first_name, groups

3. **Remove User from Client**
   - `DELETE /clientes/{cliente_id}/usuarios/{user_id}/`
   - Removes user from client AND deletes user from system
   - Staff only
   - Cannot remove self

## Backend Behavior

### Admin User Flow
1. Frontend calls `GET /usuarios-admin/?is_staff=true`
2. Backend returns staff users with groups
3. Frontend displays in user list

### Client User Flow
1. Frontend gets user's `cliente` from auth token
2. Frontend calls `GET /clientes/{cliente_id}/`
3. Backend returns client with `usuarios`
4. Frontend displays in user list

## No Changes Required

The existing backend endpoints provide all necessary functionality:

- `UserAdminViewSet` supports `?is_staff=true` filtering
- `ClienteViewSet` returns `usuarios` in serializer
- `remover_usuario` action handles user removal

## Permissions

- `GET /usuarios-admin/` - Requires authentication
- `GET /clientes/{id}/` - Requires user to be linked to client
- `DELETE /clientes/{id}/usuarios/{user_id}/` - Staff only

## Testing

Existing tests cover:
- Staff user listing
- User removal from client
- Permission enforcement

No new backend tests required unless additional functionality is needed.

## Implementation Notes

Frontend should:
- For admin: call `GET /usuarios-admin/?is_staff=true`
- For client user: call `GET /clientes/{user.cliente}/` and extract `usuarios`
- For removal: call `DELETE /clientes/{cliente_id}/usuarios/{user_id}/`