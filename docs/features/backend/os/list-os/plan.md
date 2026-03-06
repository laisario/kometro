# Feature: Service Orders List API

> **Status**: Planning  
> **Date**: 2026-03-06  
> **Related**: 
> - Frontend: [Unified OS Page with Tabs](../../../frontend/equipe/unified-os-page-with-tabs/plan.md)
> - Current Implementation: `OrdemServicoViewSet` in `ordem_servico/views.py`

## Feature Summary

Backend API support for listing service orders (OrdemServico) with filtering capabilities. The API must support both listing all service orders and listing only the logged-in user's service orders to support the unified frontend page with tabs.

## Current State Analysis

### Existing Endpoints

#### `GET /ordens-servico/`
- **ViewSet Method**: `list()`
- **Permission**: Staff only
- **Query Params**:
  - `responsavel`: Filter by responsible user ID (optional)
  - Standard pagination params
- **Response**: Paginated list of OSs
- **Behavior**: Returns all OSs (or filtered by `responsavel` if provided)
- **Used By**: Frontend "Todas" tab

#### `GET /ordens-servico/minhas/`
- **ViewSet Method**: `minhas()` (custom action)
- **Permission**: Staff only
- **Query Params**:
  - `limit`: Optional limit for number of results
- **Response**: Array of OSs (not paginated)
- **Behavior**: Returns only OSs where `responsavel = request.user`
- **Used By**: Frontend "Minhas" tab

### Current Implementation

```python
# In OrdemServicoViewSet

def list(self, request, *args, **kwargs):
    """List OS - requires staff permission"""
    if not request.user.is_staff:
        return Response(
            {"detail": "Acesso negado. Apenas funcionários podem visualizar ordens de serviço."},
            status=status.HTTP_403_FORBIDDEN
        )
    return super().list(request, *args, **kwargs)

@action(detail=False, methods=['GET'])
def minhas(self, request):
    """
    Query params:
    - limit: Optional, limit the number of results (e.g., ?limit=5)
    """
    if not request.user.is_staff:
        return Response(
            {"detail": "Acesso negado. Apenas funcionários podem visualizar ordens de serviço."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    queryset = self.get_queryset().filter(responsavel=request.user)
    
    limit = request.query_params.get('limit')
    if limit:
        try:
            limit = int(limit)
            queryset = queryset[:limit]
        except ValueError:
            pass
    
    serializer = OrdemServicoSerializer(queryset, many=True)
    return Response(serializer.data)
```

## Target Architecture

### Strategy: Option A - Query Modes / Filters (Recommended)

**Rationale**: The current backend already supports filtering via query parameters. This approach:
- Maintains backward compatibility
- Reuses existing endpoints
- Requires minimal backend changes
- Aligns with DRF conventions

### Endpoint Behavior

#### `GET /ordens-servico/`
- **Purpose**: List all service orders (with optional filtering)
- **Query Params**:
  - `responsavel`: Filter by responsible user ID (optional)
  - `page_size`: Pagination size (default from DRF settings)
  - Standard pagination params
- **Response**: Paginated list of OSs
- **Used By**: Frontend "Todas" tab

#### `GET /ordens-servico/minhas/`
- **Purpose**: List only logged-in user's service orders
- **Query Params**:
  - `limit`: Optional limit for number of results
  - Consider adding pagination support (future enhancement)
- **Response**: Array of OSs where `responsavel = request.user`
- **Used By**: Frontend "Minhas" tab

### Alternative Strategy: Option B (Not Recommended)

**Option B** would involve creating separate endpoints for:
- General statistics
- My statistics
- General list
- My list

**Why Not Recommended**:
- Current architecture already supports the use case
- Would require more endpoints and complexity
- Statistics can be calculated client-side from OS lists
- No clear benefit over current approach

## API Design

### Endpoint: `GET /ordens-servico/`

**Purpose**: List all service orders with optional filtering

**Query Parameters**:
- `responsavel` (optional): Filter by responsible user ID
  - Example: `?responsavel=5`
  - If provided, returns only OSs where `responsavel_id = 5`
  - If omitted, returns all OSs
- `page_size` (optional): Number of results per page
  - Example: `?page_size=9999` (for fetching all)
  - Default: DRF pagination setting
- Standard pagination: `page`, `page_size`

**Response Format**:
```json
{
  "count": 150,
  "next": "http://api.example.com/ordens-servico/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "numero": "0015A26-OS-CAL-001",
      "proposta_numero": "0015A26",
      "cliente_nome": "Empresa ABC",
      "responsavel": 5,
      "data_expiracao": "2024-12-31",
      "tipo_os": "CAL",
      "status": "AR",
      "instrumentos_count": 3
    }
  ]
}
```

**Validations**:
- User must be staff (`is_staff = True`)
- Returns 403 if non-staff user attempts access
- `responsavel` must be valid user ID (if provided)
- Returns empty results if `responsavel` doesn't exist

### Endpoint: `GET /ordens-servico/minhas/`

**Purpose**: List only logged-in user's service orders

**Query Parameters**:
- `limit` (optional): Limit number of results
  - Example: `?limit=5`
  - If provided, returns first N results
  - If omitted, returns all user's OSs

**Response Format**:
```json
[
  {
    "id": 1,
    "numero": "0015A26-OS-CAL-001",
    "proposta_numero": "0015A26",
    "cliente_nome": "Empresa ABC",
    "responsavel": 5,
    "data_expiracao": "2024-12-31",
    "tipo_os": "CAL",
    "status": "AR",
    "instrumentos_count": 3
  }
]
```

**Validations**:
- User must be staff (`is_staff = True`)
- Returns 403 if non-staff user attempts access
- Automatically filters by `responsavel = request.user`
- `limit` must be positive integer (if provided)

**Future Enhancement**: Consider adding pagination support to match `/ordens-servico/` behavior.

## Business Rules

### BR-LIST-1: Permission Requirements
- Only staff users can list service orders
- Both endpoints require `is_staff = True`
- Non-staff users receive 403 Forbidden

### BR-LIST-2: Filtering Rules
- `/ordens-servico/` returns all OSs by default
- `/ordens-servico/?responsavel=X` returns only OSs where `responsavel_id = X`
- `/ordens-servico/minhas/` automatically filters by `responsavel = request.user`
- Filtering is server-side (efficient, secure)

### BR-LIST-3: Data Consistency
- Both endpoints return same OS structure
- Serializer is consistent (`OrdemServicoSerializer`)
- Status values are standardized (AR, EA, RE, CA)
- Tipo OS values are standardized (CAL, BAL, MAN, EXT)

## Statistics Calculation

### Current Approach: Client-Side Calculation

**Rationale**: Statistics are calculated on the frontend from the OS list data. This approach:
- Reduces backend complexity
- Allows flexible statistics calculation
- No additional API calls needed
- Statistics always match displayed data

### Statistics Computed

From the OS list, frontend calculates:
- **Todos**: Total count of OSs
- **A realizar**: Count where `status = 'AR'` or `status = 'a_realizar'`
- **Em andamento**: Count where `status = 'EA'` or `status = 'em_andamento'`
- **Finalizadas**: Count where `status = 'RE'` or `status = 'realizado'`

### Alternative: Backend Statistics Endpoint (Not Required)

If statistics calculation becomes a performance concern, a dedicated endpoint could be added:
- `GET /ordens-servico/statistics/` - General statistics
- `GET /ordens-servico/minhas/statistics/` - User-specific statistics

**Current Assessment**: Not needed. Client-side calculation is sufficient.

## Data and Domain Analysis

### Entities Involved

#### `OrdemServico` Model
- `id`: Primary key
- `numero`: OS number (string)
- `proposta`: Foreign key to `Proposta`
- `responsavel`: Foreign key to `User` (nullable)
- `data_expiracao`: Expiration date (nullable)
- `tipo_os`: OS type (CAL, BAL, MAN, EXT)
- `status`: OS status (AR, EA, RE, CA)
- `data_criacao`: Creation timestamp

#### Relationships
- `OrdemServico.proposta` → `Proposta`
- `OrdemServico.responsavel` → `User`
- `OrdemServico.instrumentos_os` → `InstrumentoOS` (through model)

### Query Optimization

#### Current Queryset
```python
def get_queryset(self):
    queryset = OrdemServico.objects.select_related(
        'proposta__cliente__empresa', 
        'responsavel'
    ).prefetch_related('instrumentos')
    
    responsavel_id = self.request.query_params.get('responsavel')
    if responsavel_id:
        queryset = queryset.filter(responsavel_id=responsavel_id)
    
    return queryset.order_by('-data_criacao')
```

**Optimizations**:
- `select_related` for foreign keys (proposta, cliente, empresa, responsavel)
- `prefetch_related` for instrumentos (if needed)
- Index on `responsavel` field for efficient filtering
- Ordering by `-data_criacao` (newest first)

## Migration Strategy

### Phase 1: No Backend Changes Required

**Current State**: Backend already supports the unified page requirements:
- `/ordens-servico/` supports listing all OSs
- `/ordens-servico/minhas/` supports listing user's OSs
- Both endpoints have proper permissions
- Filtering works correctly

**Action**: No backend changes needed for initial implementation.

### Phase 2: Optional Enhancements (Future)

#### Enhancement 1: Pagination for `/minhas/`
- **Current**: Returns array (no pagination)
- **Enhancement**: Add pagination support to match `/ordens-servico/`
- **Benefit**: Better performance for users with many OSs
- **Priority**: Low (current approach works for typical use cases)

#### Enhancement 2: Statistics Endpoint
- **Current**: Statistics calculated client-side
- **Enhancement**: Add dedicated statistics endpoints
- **Benefit**: Reduced data transfer, faster statistics
- **Priority**: Low (current approach is sufficient)

### Phase 3: Deprecation (After Frontend Migration)

#### Deprecate `/minhas/` Endpoint? (Not Recommended)

**Current Assessment**: Keep `/minhas/` endpoint.

**Rationale**:
- Endpoint is simple and efficient
- Provides clear semantic meaning
- No maintenance burden
- Can be used by other clients (mobile, etc.)

**Alternative**: Could use `/ordens-servico/?responsavel=current_user_id` instead, but `/minhas/` is more intuitive.

## Edge Cases

### Empty Results

#### No OSs in System
- **Endpoint**: `/ordens-servico/`
- **Response**: Empty results array or empty paginated response
- **Status**: 200 OK
- **Frontend**: Shows empty state message

#### User Has No OSs
- **Endpoint**: `/ordens-servico/minhas/`
- **Response**: Empty array `[]`
- **Status**: 200 OK
- **Frontend**: Shows "Você ainda não possui ordens de serviço atribuídas"

### Invalid Parameters

#### Invalid `responsavel` ID
- **Endpoint**: `/ordens-servico/?responsavel=99999`
- **Response**: Empty results (user doesn't exist)
- **Status**: 200 OK
- **Behavior**: Valid - returns empty list

#### Invalid `limit` Value
- **Endpoint**: `/ordens-servico/minhas/?limit=abc`
- **Response**: Ignores invalid limit, returns all results
- **Status**: 200 OK
- **Current Behavior**: Tolerates invalid values gracefully

### Permission Issues

#### Non-Staff User
- **Endpoint**: Any `/ordens-servico/*` endpoint
- **Response**: `{"detail": "Acesso negado. Apenas funcionários podem visualizar ordens de serviço."}`
- **Status**: 403 Forbidden
- **Frontend**: Redirects to 404

## Acceptance Criteria

### Endpoint Functionality
- [ ] `GET /ordens-servico/` returns all OSs when no filter provided
- [ ] `GET /ordens-servico/?responsavel=X` returns only OSs for that user
- [ ] `GET /ordens-servico/minhas/` returns only current user's OSs
- [ ] Both endpoints require staff permission
- [ ] Both endpoints return consistent OS structure

### Performance
- [ ] Queries use `select_related` for foreign keys
- [ ] Filtering by `responsavel` is efficient (indexed)
- [ ] Pagination works correctly for large datasets
- [ ] Response times are acceptable (< 500ms for typical queries)

### Data Consistency
- [ ] OS structure is consistent between endpoints
- [ ] Status values are standardized
- [ ] Tipo OS values are standardized
- [ ] Serializer fields are consistent

## Open Questions

1. **Pagination for `/minhas/`**: Should we add pagination support? (Proposed: Not required initially, can be added if needed)
2. **Statistics Endpoint**: Should we add dedicated statistics endpoints? (Proposed: Not required, client-side calculation is sufficient)
3. **Deprecation**: Should `/minhas/` be deprecated in favor of `/ordens-servico/?responsavel=current_user`? (Proposed: No, keep `/minhas/` for clarity)
4. **Caching**: Should we add caching for frequently accessed queries? (Proposed: Evaluate based on performance needs)

## Related Documentation

- Frontend: [Unified OS Page with Tabs](../../../frontend/equipe/unified-os-page-with-tabs/plan.md)
- Current Implementation: `bef-backend/app/ordem_servico/views.py`
- Model Definition: `bef-backend/app/ordem_servico/models.py`
