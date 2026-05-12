# Feature: Add User List to Access Page

## Feature Summary

Add a users section/card to the `/acessos` page that displays users with access to the system. The behavior differs based on user type:
- **Admin/staff users**: See all staff users in the system
- **Client users**: See other users linked to the same client

## User Value

### Problem Solved
Users with access to the organization need visibility into who else has access. The `/acessos` page currently only shows invite/links but not actual users.

### Who Benefits
- **Administrators**: View all staff users, remove access
- **Client users**: View other users from their client, request removal

## Scope

### In Scope
- Display users list on `/acessos` page
- Admin sees all staff users
- Client user sees users from same client
- Remove user/access functionality
- Preserve existing invite generation/listing

### Out of Scope
- Edit user roles
- Add users directly (use invite system)
- Bulk operations

## Current Behavior Summary

### Current `/acessos` Page
- `UserAccessPage.jsx` has two columns:
  - Left: `InviteGenerator` - create new invites
  - Right: `InviteList` - list existing invites
- No users section

### Client Details Page (Reference)
- `ClientInformation.jsx` has a "Usuários" tab in a card
- Fetches users from `data.usuarios` (from client endpoint)
- Uses `useClientMutations().removeUser` to delete users
- Uses `RemoveUserDialog` for confirmation

### Backend Endpoints
- `GET /usuarios-admin/` - List users (supports `?is_staff=true`)
- `GET /clientes/{id}/` - Returns client with `usuarios` array
- `DELETE /clientes/{id}/usuarios/{user_id}/` - Remove user from client

### Auth Context
- `user?.admin` - boolean, true for staff users
- `user?.cliente` - client ID for non-staff users

## User Flow

### Admin Views Users
1. Admin navigates to `/acessos`
2. Page shows three sections: Invite Generator, Invite List, Users
3. Users section lists all staff users
4. Admin can remove a user (with confirmation)

### Client User Views Users
1. Client user navigates to `/acessos`
2. Page shows three sections: Invite Generator, Invite List, Users
3. Users section lists users from same client
4. User can request removal (or self-removal allowed)

## Acceptance Criteria

- [ ] `/acessos` page shows Users section
- [ ] Admin sees all staff users in Users section
- [ ] Client user sees users from same client
- [ ] Each user shows name, username, groups/chips
- [ ] Remove button visible for each user (respecting permissions)
- [ ] Confirmation dialog before removing
- [ ] UI updates after removal without page reload
- [ ] Existing invite functionality preserved

## Frontend Behavior

### New Component Structure

#### Option A: Reuse ClientInformation's Users Tab Logic
Create a new component `UserList.jsx` that can be reused in both places.

#### Option B: Create Page-Specific User List
Add user list directly to `UserAccessPage.jsx`

### Recommended: Option A - Shared Component

Create `frontend/src/access/components/UserList.jsx`:
```jsx
// Props:
// - userType: 'admin' | 'client'
// - clienteId: (for client type) the client ID to filter by
// - currentUser: the logged-in user object
```

### UI Design
- Card with "Usuários" header
- List similar to ClientInformation users tab
- Remove button per user (icon button with PersonRemoveIcon)
- Chips showing user groups

### Key States
- **Loading**: Fetching users
- **Loaded**: User list displayed
- **Confirming**: Remove dialog open
- **Removing**: Loading indicator on button
- **Removed**: List refreshes, snackbar confirmation
- **Error**: Error snackbar

### Data Fetching
- For admin: `GET /usuarios-admin/?is_staff=true`
- For client: Get from client's user list (reuse existing pattern)

### Remove User Flow
1. Click remove button on user
2. Dialog opens with confirmation
3. Confirm → API call `DELETE /clientes/{id}/usuarios/{user_id}/`
4. On success → invalidate queries, show success snackbar

## Implementation Checklist

### Frontend
- [ ] Create `UserList.jsx` component (reusable)
- [ ] Add to `UserAccessPage.jsx`
- [ ] Handle admin vs client user detection
- [ ] Implement remove user dialog
- [ ] Wire up mutation with query invalidation
- [ ] Test admin view shows staff users
- [ ] Test client view shows same-client users

### Backend (if needed)
- [ ] No new endpoints needed (existing endpoints sufficient)
- [ ] Verify permissions for user listing

## Edge Cases

### Admin Case
- No staff users: Show "Nenhum usuário encontrado"
- Remove self: Prevent (show error or don't show button for self)
- Last admin: Allow removal (with warning?)

### Client User Case
- No other users: Show "Nenhum usuário encontrado"
- Remove self: Allowed (user can remove own access)
- Remove another client user: Allowed

### Permissions
- Only staff can remove users from clients
- Client users can only see their own client's users

## Reuse Patterns

### From ClientInformation.jsx
- `usuarios.map()` rendering
- `Chip` for groups
- `permissionLabel` utility
- `PersonRemoveIcon` button
- `RemoveUserDialog` component

### From useClientMutations.js
- `removeUser` mutation
- `queryClient.invalidateQueries()` pattern

### From useAuth
- `user?.admin` for admin detection
- `user?.cliente` for client ID