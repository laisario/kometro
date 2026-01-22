# Feature: My OS Page (Minhas Ordens de Servico)

## Feature Summary

Personal page for staff users to view all OrdemServico they are responsible for. Shows comprehensive list with filters and OS details.

## User Value

### Problem Solved
Staff members need a dedicated place to see their assigned work orders without navigating through proposals or other areas.

### Who Benefits
- **Lab Technicians**: See their workload at a glance
- **Staff Members**: Track their assigned calibrations

## Scope

### In Scope
- List all OS where current user is responsavel
- Show OS details: numero, proposta, instruments count, expiration date
- Expandable rows to see instruments in each OS
- Filter by status (pending, in progress, completed)

### Out of Scope
- Edit OS assignments
- Change responsavel
- Create new OS manually

## User Flow

### Primary Flow
1. Staff user clicks "Minhas OS" in nav or goes to `/eu`
2. System fetches OS where responsavel = current user
3. User sees list of their assigned OS
4. User can expand to see instruments in each OS

### Alternate Flows

#### Empty State
- No OS assigned: "Voce ainda nao possui ordens de servico atribuidas"

#### Error State
- API error: Error message with retry

## Acceptance Criteria

- [ ] Route `/eu` accessible to staff users
- [ ] Lists OS where responsavel = current user
- [ ] Shows: numero, proposta.numero, cliente, instrument count, data_expiracao
- [ ] Expandable to show instruments list
- [ ] Loading and empty states

## Frontend Behavior

#### Screens/Components
- `MinhasOSPage` — Main page
- `OSList` — Reusable list component
- `OSCard` — Individual OS display with expand

#### Key States
- Loading: Skeleton or spinner
- Empty: Illustration + message
- Success: List of OS cards

## Data & Permissions

### Backend Endpoints
- `GET /api/ordens-servico/minhas/` — Get all OS for current user
- `GET /api/ordens-servico/{id}/` — Get OS detail with instruments (for expand)

### Entities Touched
- `OrdemServico` — Read (filtered by current user)
- `InstrumentoDoCliente` — Read (via OS)

### Permissions
- **Staff users**: Access own OS
- **Non-staff**: No access (redirect)

## Edge Cases & Failures

### Validation Errors
- N/A (read-only page)

### Missing Data
- OS has no instruments: Show "Sem instrumentos"
- OS has no expiration date: Show "Sem prazo"

### Permission Denied
- Non-staff user: Redirect to dashboard or 404

### Network/Integration Failures
- API timeout: Show error with retry button

## Observability

### Logs/Events
- Page load: track my OS page view
- OS expand: track which OS was expanded

## Open Questions

- [ ] Should there be a way to mark OS as "in progress" or "completed"?
- [ ] Should we add date range filtering?

