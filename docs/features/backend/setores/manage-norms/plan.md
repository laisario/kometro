# Feature: Manage Norms

## Feature Summary

CRUD operations for normative standards (Normativo) that can be associated with instruments for compliance tracking.

## User Value

### Problem Solved
Organizations follow various regulatory standards. Instruments need to be tagged with applicable norms for compliance reporting.

### Who Benefits
- **Quality Managers**: Define applicable standards
- **Auditors**: Filter by compliance requirements

## Scope

### In Scope
- Create, read, update, delete norms
- Client-specific norms
- List all norms for client

### Out of Scope
- Standard templates
- Compliance checking

## User Flow

### Primary Flow
1. User manages norms list
2. User adds new norm
3. Norm available for instrument association

## Acceptance Criteria

- [ ] CRUD operations on Normativo
- [ ] Filter by client
- [ ] No pagination (full list)
- [ ] Ordered by name

## Backend Behavior

### Endpoints
- `GET /normativos/?cliente=X` — List norms
- `POST /normativos/` — Create norm
- `PUT /normativos/{id}/` — Update norm
- `DELETE /normativos/{id}/` — Delete norm

### Request (Create)
```json
{
  "nome": "ISO 17025",
  "cliente": 1
}
```

### Business Rules
- Filter by cliente parameter
- Ordered alphabetically by nome
- No pagination

### Validations
- nome required
- cliente optional (global norms)

## Data & Permissions

### Entities Touched
- `Normativo` — CRUD

### Permissions
- **Authenticated Users**: Manage own client norms

## Edge Cases & Failures

### Validation Errors
- Missing name: Return 400

## Observability

### Logs/Events
- Norm changes logged

## Open Questions

- [ ] Should norms be shared across clients?
- [ ] Should deletion be blocked if instruments use the norm?

