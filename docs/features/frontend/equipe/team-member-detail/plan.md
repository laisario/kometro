# Feature: Team Member Detail

## Feature Summary

Detail page showing all OrdemServico assigned to a specific staff member. Accessible by managers (gerente) at `/admin/equipe/:userId`. Displays comprehensive information about each OS including instruments, expiration dates, and proposal details. Gerente users can also edit OS assignments (responsavel, data_expiracao).

## User Value

### Problem Solved
Managers need to view the workload and assignments of specific team members to balance work distribution and track progress.

### Who Benefits
- **Gerente (Manager)**: Can monitor individual team member workloads
- **Quality Managers**: Can verify assignment distribution

## Scope

### In Scope
- Display staff member info (name, email)
- List all OS where user is responsavel
- Show OS details: numero, proposta, instruments count, data_expiracao
- Expandable rows to see instruments in each OS
- Back navigation to team list
- **Edit OS (gerente only)**: Edit responsavel and data_expiracao fields
- Reassign responsavel to another staff member

### Out of Scope
- Create new OS manually
- Direct messaging to staff member
- Delete OS
- Edit instruments within OS

## User Flow

### Primary Flow
1. Manager navigates to `/admin/equipe/:userId` (from team list or direct link)
2. System fetches staff member info and their OS list
3. Manager sees member info header and OS list
4. Manager can expand OS row to see instruments
5. Manager can navigate back to team list

### Edit OS Flow (Gerente Only)
1. Manager clicks edit button on OS row
2. Edit dialog/form opens with current values
3. Manager can change:
   - `responsavel`: Select from dropdown of staff users
   - `data_expiracao`: Date picker
4. Manager clicks save
5. System validates and updates OS via API
6. Success: Close dialog, refresh list, show success toast
7. Error: Show error message in dialog

### Alternate Flows

#### Empty State
- No OS assigned to member: "Este membro ainda não possui ordens de serviço atribuídas"

#### Error State
- API error: Show error message with retry button
- User not found: Show 404 page

## Acceptance Criteria

- [ ] Page accessible only to users with "gerente" group
- [ ] Displays correct staff member info (name, email)
- [ ] Lists all OS where responsavel = userId
- [ ] Shows: numero, proposta.numero, cliente, instrument count, data_expiracao
- [ ] Expandable rows show instruments list
- [ ] Loading and empty states handled
- [ ] Back button to team list
- [ ] Edit button visible on each OS row (gerente only)
- [ ] Edit dialog allows changing responsavel and data_expiracao
- [ ] Responsavel dropdown shows all staff users
- [ ] Save updates OS via PATCH API
- [ ] Success toast on save
- [ ] List refreshes after successful edit

## Frontend Behavior

#### Screens/Components
- `EquipeMemberPage` — Main page component
- `OSList` — Reusable OS list component (shared with MinhasOSPage)
- `OSCard` — Individual OS display with expand functionality
- `EditOSDialog` — Modal dialog for editing OS (gerente only)

#### Key States
- Loading: Skeleton loader for header + list
- Empty: EmptyYet component with message
- Error: Error message with retry
- Success: Member header + OS list
- Editing: Dialog open with form
- Saving: Dialog with disabled form + loading indicator

## Data & Permissions

### Backend Endpoints
- `GET /api/users/{id}/` — Get staff member info
- `GET /api/ordens-servico/?responsavel={id}` — List OS by responsavel
- `GET /api/ordens-servico/{id}/` — Get OS detail with instruments
- `PATCH /api/ordens-servico/{id}/` — Update OS (responsavel, data_expiracao)
- `GET /api/users/?is_staff=true` — Staff users for responsavel dropdown

### Entities Touched
- `User` — Read (single user by id, staff users list for dropdown)
- `OrdemServico` — Read (filtered by responsavel), **Write (update responsavel, data_expiracao)**
- `InstrumentoDoCliente` — Read (via OS)
- `Proposta` — Read (via OS)

### Permissions
- **Gerente**: Full access to view and edit any staff member's OS
- **Other roles**: No access (redirect to 404)

## Edge Cases & Failures

### Validation Errors
- Invalid date format: Show field error
- Responsavel not found: Show error toast

### Missing Data
- OS has no instruments: Show "Sem instrumentos"
- OS has no expiration date: Show "Sem prazo"

### Permission Denied
- Non-gerente user: Redirect to 404
- Edit attempt by non-gerente: API returns 403, show error toast

### Network/Integration Failures
- API timeout: Show error with retry button
- User not found: Show 404
- Edit save fails: Show error in dialog, keep form open

## Observability

### Logs/Events
- Page load: track member detail view with userId
- OS expand: track which OS was expanded
- Edit click: track OS edit initiated
- Edit save: track OS edit completed (success/failure)

## Open Questions

- [ ] Should we show OS status (pending, in progress, completed)?
- [ ] Should we allow filtering OS by date range?
- [x] ~~Should gerente be able to edit OS?~~ Yes, can edit responsavel and data_expiracao

