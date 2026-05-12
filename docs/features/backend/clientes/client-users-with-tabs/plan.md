# Feature: Client Users Card with Tabs (Usuários + Acessos)

## Feature Summary

Add tabs to the client details page Users card to show both linked users and generated access/invite links.

## User Value

### Problem Solved
- Administrators need to see both users linked to a client AND access links generated for that client.
- Currently, the Users card only shows linked users.
- The /acessos page shows all access links but not filtered by client.

### Who Benefits
- **Team Managers**: View users and access links in one place.
- **Administrators**: Monitor access links for specific clients.

## Scope

### In Scope
- Usuários tab: Show users linked to client (existing behavior)
- Acessos tab: Show access links generated for this client
- Tab switching behavior
- Filter invites by client

### Out of Scope
- Creating invites (already exists in the card)
- Resending invites
- Bulk operations

## Current Behavior

### Backend
- `Convite` model stores: token_jti, grupo, criado_por, criado_em, usado, cliente
- Endpoint: `GET /convites/` - returns all invites for user's organization
- ConviteSerializer fields: id, token_jti, grupo, criado_por, criado_em, usado, cliente, expira_em

### Frontend
- `ClientInformation.jsx` has Users card with user list
- `useInvites.js` hook fetches all invites
- `InviteList.jsx` displays invite list (does NOT show generated link URL)

## Needed Improvements

### InviteList Issue
The current InviteList component:
- Does NOT display the generated invite URL (convite_url)
- This is needed for the Acessos tab

## Backend Behavior

### Existing Endpoints
- `GET /convites/` — List all invites (filtered by user/org)
- `POST /invites/create/` — Create new invite

### Required Changes
- Create endpoint to list invites filtered by cliente_id:
  - `GET /clientes/{cliente_id}/convites/` 
  - OR add filtering to existing `/convites/` endpoint
- ConviteSerializer should include generated link (convite_url) in response

### Response Fields
```json
{
  "id": 1,
  "token_jti": "uuid",
  "convite_url": "http://site/#/register/invite/...",
  "grupo": { "id": 1, "name": "gerente" },
  "criado_por": { "id": 1, "first_name": "Admin" },
  "criado_em": "2024-01-01T00:00:00Z",
  "usado": false,
  "cliente": { "id": 1, "empresa": { "razao_social": "Company" } },
  "expira_em": "2024-01-08T00:00:00Z"
}
```

### Permissions
- Staff only: View and create invites
- Filter by cliente_id for customer-specific access links

## Frontend Behavior

### Components to Modify/Create
- `ClientInformation.jsx` — Add Tabs component
- `ClientUsersTab.jsx` — Existing user list (rename from inline)
- `ClientAccessTab.jsx` — New: access links list for client

### Tab Data Flow
```
ClientInformation
├── Tabs (Usuários | Acessos)
├── Usuários Tab
│   └── users list (existing)
└── Acessos Tab
    └── access links (new)
```

### Fetching Access Links
```javascript
// useInvites.js needs client filtering
const { invites, isFetching } = useInvites(clienteId);
```

### Loading States
- **Loading**: Spinner while fetching
- **Loaded**: List displayed
- **Empty**: No access links for this client

## Data Entities

### Convite Model
- id
- token_jti (JWT identifier)
- grupo (ForeignKey to Group)
- criado_por (ForeignKey to User)
- criado_em (DateTime)
- usado (Boolean)
- cliente (ForeignKey to Cliente)

### Serializer Fields Needed
- id, convite_url, grupo, criado_por, criado_em, usado, cliente, expira_em

## Acceptance Criteria

- [x] GET /convites/ endpoint exists
- [x] ConviteSerializer includes convite_url field
- [x] Response includes generated invite URL
- [x] Response includes grupo, usado status
- [x] Staff only can view (via NivelPermission)

## Implementation Status

### Backend (COMPLETE)
- [x] Added `convite_url` field to ConviteSerializer
- [x] `convite_url` is generated using `settings.SITE` + token_jti
- [x] Added `ConviteListAPITestCase` tests:
  - [x] test_list_convites_includes_convite_url
  - [x] test_list_convites_filtered_by_cliente
  - [x] test_non_staff_cannot_list_convites

## Open Questions
- Frontend needs to add filtering by cliente_id when calling the API