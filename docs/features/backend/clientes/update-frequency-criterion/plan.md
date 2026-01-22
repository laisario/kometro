# Feature: Update Frequency Criterion

## Feature Summary

Updates the client's default calibration frequency criterion (Calendar Time vs Service Time). This affects how new instruments calculate their next calibration dates.

## User Value

### Problem Solved
Organizations operate differently — some need calendar-based schedules, others service-time based. This allows customization per client.

### Who Benefits
- **Quality Managers**: Set organizational calibration policy
- **Administrators**: Configure client preferences

## Scope

### In Scope
- Update criterio_frequencia_padrao field
- Return success status

### Out of Scope
- Retroactive updates to existing instruments
- Bulk client updates

## User Flow

### Primary Flow
1. User opens client settings
2. User selects frequency criterion
3. System updates client preference
4. Future instruments use new criterion

## Acceptance Criteria

- [ ] Updates criterio_frequencia_padrao
- [ ] Returns 204 No Content
- [ ] Does not affect existing instruments

## Backend Behavior

### Endpoints
- `PATCH /clientes/{id}/atualizar_criterio_frequencia_padrao/` — Update criterion

### Request Body
```json
{
  "criterio_frequencia": "S"
}
```

### Criterion Choices
- `C` — Tempo de calendário (Calendar Time)
- `S` — Tempo de serviço (Service Time)

### Business Rules
- Only updates the specified field
- Uses update_fields for efficiency
- New instruments inherit this default

### Validations
- Valid criterion choice required
- Client must exist

## Data & Permissions

### Entities Touched
- `Cliente` — Update

### Permissions
- **NivelPermission**: Role-based access

## Edge Cases & Failures

### Validation Errors
- Invalid criterion: Return 400

### Missing Data
- Client not found: Return 404

## Observability

### Logs/Events
- Criterion updated: client ID, new value, user

## Open Questions

- [ ] Should existing instruments be updateable in bulk?

