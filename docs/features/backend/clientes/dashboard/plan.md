# Feature: Dashboard

## Feature Summary

Returns aggregated statistics and recent activity for the dashboard view. Different data is returned for staff vs client users.

## User Value

### Problem Solved
Users need a quick overview of their metrological operations — what needs attention, what's pending, recent activity.

### Who Benefits
- **Quality Managers**: Monitor compliance at a glance
- **Staff**: Overview across all clients
- **All Users**: See pending actions

## Scope

### In Scope
- Instrument statistics
- Document statistics
- Proposal statistics
- Pending revision approvals
- Recent items

### Out of Scope
- Historical trends
- Custom date ranges
- Detailed analytics

## User Flow

### Primary Flow
1. User logs in
2. User lands on dashboard
3. System returns statistics
4. User sees overview and pending items

## Acceptance Criteria

- [ ] Returns instrument counts (expired, in compliance)
- [ ] Returns document expiration count
- [ ] Returns pending proposal count (staff) or awaiting approval count (client)
- [ ] Returns pending revision approvals for user
- [ ] Returns recent proposals list
- [ ] Returns recent instruments (client only)

## Backend Behavior

### Endpoints
- `GET /dashboard/` — Get dashboard data

### Response (Staff)
```json
{
  "instrumentos_vencidos": 15,
  "instrumentos_em_dia": 450,
  "documentos_vencidos": 3,
  "propostas_em_elaboracao": 8,
  "revisoes_a_serem_aprovadas": [...],
  "ultimas_propostas": [...]
}
```

### Response (Client)
```json
{
  "instrumentos_vencidos": 2,
  "instrumentos_em_dia": 48,
  "instrumentos_cadastrados": 50,
  "propostas_aguardando_aprovacao": 1,
  "instrumentos_recentes": [...],
  "ultimas_propostas": [...],
  "revisoes_a_serem_aprovadas": [...],
  "documentos_vencidos": 1
}
```

### Business Rules
- Staff sees aggregate counts across all clients
- Clients see cached statistics from their client record
- Pending approvals filtered to current user
- Recent items limited to 5

### Validations
- User must be authenticated

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Count queries
- `Documento` — Count queries
- `Proposta` — Read (recent)
- `Revisao` — Read (pending)
- `Cliente` — Read (cached stats)

### Permissions
- **Authenticated Users**: View own dashboard
- **Staff Users**: View aggregate dashboard

## Edge Cases & Failures

### Missing Data
- User without client: Return empty/zeros

## Observability

### Logs/Events
- Dashboard access logged

### Metrics
- Dashboard load time

## Open Questions

- [ ] Should dashboard data be cached?
- [ ] Should date range filtering be added?

