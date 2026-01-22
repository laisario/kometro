# Feature: Create Sector

## Feature Summary

Creates a new sector (department/area) for organizing instruments within a client organization. Supports hierarchical structure via parent sector reference.

## User Value

### Problem Solved
Organizations need to organize instruments by location, department, or production line for easier management.

### Who Benefits
- **Quality Managers**: Structure instrument organization
- **Administrators**: Set up client organizational units

## Scope

### In Scope
- Create sector with name
- Optional parent sector (hierarchy)
- Associate with client

### Out of Scope
- Bulk creation
- Templates

## User Flow

### Primary Flow
1. User navigates to sector management
2. User enters sector name
3. User optionally selects parent sector
4. System creates sector
5. Cache invalidated

## Acceptance Criteria

- [ ] Creates sector with name and client
- [ ] Supports parent sector for hierarchy
- [ ] Invalidates hierarchy cache
- [ ] Returns created sector

## Backend Behavior

### Endpoints
- `POST /setores/` — Create sector

### Request Body
```json
{
  "nome": "Production Line A",
  "cliente": 1,
  "setor_pai": null
}
```

### Business Rules
- Cache invalidated for client hierarchy
- setor_pai creates parent-child relationship

### Validations
- nome required
- cliente required

## Data & Permissions

### Entities Touched
- `Setor` — Create
- Cache — Delete (hierarquia:{client_id})

### Permissions
- **NivelPermission**: Role-based access

## Edge Cases & Failures

### Validation Errors
- Missing name: Return 400

## Observability

### Logs/Events
- Sector created: name, client, parent

## Open Questions

- [ ] Should duplicate names be prevented?

