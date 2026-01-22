# Feature: Dashboard Recent OS Widget

## Feature Summary

Widget on admin dashboard showing the last 5 OrdemServico the logged-in staff user is responsible for, with quick access to details.

## User Value

### Problem Solved
Staff users need quick visibility of their recent assignments without navigating away from the dashboard.

### Who Benefits
- **Staff Users**: At-a-glance view of recent work orders

## Scope

### In Scope
- Show last 5 OS by creation date
- Display: numero, cliente, instrument count
- Link to full list (/eu)

### Out of Scope
- Filtering
- Pagination
- Status changes from widget

## User Flow

### Primary Flow
1. Staff user views admin dashboard
2. Widget shows their 5 most recent OS
3. User can click "Ver todas" to go to /eu
4. User can click OS to expand details

### Alternate Flows

#### Empty State
- No OS assigned: "Nenhuma OS atribuida"

#### Error State
- API error: Show minimal error, don't break dashboard

## Acceptance Criteria

- [ ] Widget visible only on admin dashboard for staff users
- [ ] Shows last 5 OS ordered by data_criacao desc
- [ ] Each OS shows: numero, cliente name, instruments count
- [ ] "Ver todas" link to /eu
- [ ] Loading state while fetching

## Frontend Behavior

#### Screens/Components
- `AppRecentOS` — Widget component (similar to AppOrderTimeline)

#### Key States
- Loading: Skeleton
- Empty: "Nenhuma OS atribuida"
- Success: List of 5 OS

## Data & Permissions

### Backend Endpoints
- `GET /api/ordens-servico/minhas/?limit=5` — Get last 5 OS for current user

### Entities Touched
- `OrdemServico` — Read (last 5, current user)

### Permissions
- **Staff users**: See widget
- **Non-staff admin**: Widget hidden

## Edge Cases & Failures

### Validation Errors
- N/A (read-only widget)

### Missing Data
- OS has no cliente: Show proposta numero instead

### Permission Denied
- Non-staff user: Widget not rendered

### Network/Integration Failures
- API error: Show subtle error state, don't break dashboard

## Observability

### Logs/Events
- Widget load: track dashboard OS widget view
- "Ver todas" click: track navigation to /eu

## Open Questions

- [ ] Should clicking an OS row navigate to OS detail or expand inline?
- [ ] Should we show OS status indicator?

