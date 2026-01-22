# Feature: Sector Hierarchy

## Feature Summary

Returns the complete sector hierarchy for a client as a nested tree structure, including instruments at each level. Results are cached for performance.

## User Value

### Problem Solved
Users need to visualize the organizational structure and find instruments by navigating the hierarchy.

### Who Benefits
- **All Users**: Navigate instrument organization
- **Quality Managers**: View complete structure

## Scope

### In Scope
- Nested hierarchy tree
- Instruments per sector
- Cache for performance

### Out of Scope
- Hierarchy editing
- Statistics per sector

## User Flow

### Primary Flow
1. User opens instruments page
2. Frontend requests hierarchy
3. System returns cached tree
4. User navigates structure

## Acceptance Criteria

- [ ] Returns nested tree structure
- [ ] Includes subsetores recursively
- [ ] Includes instruments at each level
- [ ] Cached for 5 minutes
- [ ] cliente_id required

## Backend Behavior

### Endpoints
- `GET /setores/hierarquia/?cliente_id=X` — Get hierarchy

### Response
```json
[
  {
    "id": 1,
    "nome": "Factory A",
    "subsetores": [
      {
        "id": 2,
        "nome": "Line 1",
        "subsetores": [],
        "instrumentos": [
          {"id": 1, "tag": "TERM-001"}
        ]
      }
    ],
    "instrumentos": []
  }
]
```

### Business Rules
- Cache key: `hierarquia:{cliente_id}`
- Cache TTL: 300 seconds (5 min)
- Builds tree in memory from flat query
- Only returns roots at top level

### Validations
- cliente_id required

## Data & Permissions

### Entities Touched
- `Setor` — Read
- `InstrumentoDoCliente` — Read
- Cache — Read/Write

### Permissions
- **Authenticated Users**: View own client hierarchy
- **Staff Users**: View any client

## Edge Cases & Failures

### Missing Data
- No cliente_id: Return 400

## Observability

### Logs/Events
- Cache hit/miss logged

### Metrics
- Cache hit rate

## Open Questions

- [ ] Should instrument count be included instead of list?
- [ ] Should cache TTL be configurable?

