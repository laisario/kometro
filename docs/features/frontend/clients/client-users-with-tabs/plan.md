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

## Implementation Guidance

### Backend Reuse
- Backend: Filter existing `/convites/` endpoint by cliente_id
- Include `convite_url` in ConviteSerializer response
- See backend documentation: `docs/features/backend/clientes/client-users-with-tabs/plan.md`

### Frontend Reuse
- `useInvites.js` hook already exists in `/access/hooks/`
- `InviteList.jsx` already exists in `/access/components/`
- Need to: 
  1. Update `useInvites.js` to accept optional clienteId filter
  2. Create client-specific access tab
  3. Update InviteList to show generated link (currently missing)

## Current Code to Reference

### Existing Hook: useInvites.js
Location: `frontend/src/access/hooks/useInvites.js`
```javascript
function useInvites() {
  // Does NOT filter by cliente_id
  // Need to add optional clienteId parameter
}
```

### Existing Component: InviteList.jsx
Location: `frontend/src/access/components/InviteList.jsx`
- Shows: group, created by, expiration date, status (used/not used)
- MISSING: Generated invite URL (convite_url)

### Existing Client Card: ClientInformation.jsx
Location: `frontend/src/clients/components/ClientInformation.jsx`
- Has Users card with user list
- Needs: Add Tabs component

## User Flow

### Acessos Tab Flow
1. User clicks "Acessos" tab
2. System fetches invites for this client
3. Shows access links list with:
   - Generated link (copy button)
   - Status: "Usado" / "Não usado"
   - Group (gerente/registrador/observador)
4. User can copy link to clipboard

## Backend API

### Endpoint
- `GET /convites/?cliente={cliente_id}` — Filtered by client
- OR new endpoint: `GET /clientes/{cliente_id}/convites/`

### Response
```json
{
  "results": [
    {
      "id": 1,
      "convite_url": "http://localhost:5173/#/register/invite/eyJ...",
      "grupo": { "id": 1, "name": "gerente" },
      "criado_por": { "id": 1, "first_name": "Admin" },
      "criado_em": "2024-01-01T00:00:00Z",
      "usado": false,
      "expira_em": "2024-01-08T00:00:00Z"
    }
  ]
}
```

## Frontend Behavior

### Components Structure
```
ClientInformation
├── Tabs (MUI Tabs)
│   ├── Tab 1: "Usuários"
│   └── Tab 2: "Acessos"
├── TabPanel:Usuários
│   └── Current user list (existing)
└── TabPanel:Acessos
    └── InviteList for client
```

### InviteList Updates Needed
Currently InviteList does NOT show the generated link URL. Update to include:
- Generated invite URL field
- Copy to clipboard button

### Loading States
| State | Behavior |
|-------|----------|
| Initial | Tabs visible |
| Loading | Spinner in active tab |
| Loaded | List displayed |
| Empty | "Nenhum acesso gerado" message |
| Error | Error snackbar |

### Key States

#### Usuários Tab
| State | Behavior |
|-------|----------|
| Initial | User list displayed |
| Removing | Button loading |
| Removed | User removed from list |

#### Acessos Tab
| State | Behavior |
|-------|----------|
| Loading | Spinner |
| Loaded | Invite list |
| Empty | No invites message |
| Copied | "Link copiado!" snackbar |

## Data Entities

### Invite Data (from backend)
```javascript
{
  id: number,
  convite_url: string,
  grupo: { id: number, name: string },
  criado_por: { first_name: string, username: string },
  criado_em: string (ISO date),
  usado: boolean,
  expira_em: string (ISO date)
}
```

### Display Mapping
```
convite_url → "Link: {shortened_url}"
grupo.name → "Grupo: {group_label}"
usado → Status chip
```

## API Integration

### useInvites.js Update
```javascript
function useInvites(clienteId) {
  const queryKey = clienteId 
    ? ['convites', clienteId] 
    : ['convites'];
  // Fetch filtered by client when clienteId provided
}
```

### Existing Hooks to Reuse
- `useInvites` — Fetch invites (need client filter)
- `useInvitesMutations` — Create new invite

## Implementation Status

### Frontend (COMPLETE)
- [x] Updated `useInvites.js` to accept clienteId parameter
- [x] Updated `InviteList.jsx` to show invite URL and copy button
- [x] Added Tabs to `ClientInformation.jsx`
- [x] Added Usuários tab (existing behavior)
- [x] Added Acessos tab (new - uses InviteList)
- [x] Loading/empty states handled

## Implementation Checklist

### Frontend Changes (COMPLETE)
- [x] Update useInvites.js to accept clienteId
- [x] Update InviteList.jsx to show invite URL
- [x] Add Tabs to ClientInformation.jsx
- [x] Handle loading/empty/error states

## Open Questions
- [x] Feature implemented and working