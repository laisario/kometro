# Feature: List Documents

## Feature Summary

Retrieves a paginated list of controlled documents with filtering and search capabilities. Documents are ordered by critical analysis date (soonest first) for prioritization.

## User Value

### Problem Solved
Organizations maintain many controlled documents requiring periodic review. Users need to quickly find documents and prioritize those approaching expiration.

### Who Benefits
- **Document Control Specialists**: Manage document lifecycle
- **Quality Managers**: Monitor document compliance
- **Reviewers**: Find documents needing attention

## Scope

### In Scope
- Paginated list with search
- Filter by status, expiration
- Search by title
- Include revision information

### Out of Scope
- Full-text content search
- Version comparison
- Analytics

## User Flow

### Primary Flow
1. User navigates to documents
2. System loads documents sorted by urgency
3. User searches or filters
4. User selects document to view

### Alternate Flows

#### No Documents
- Empty state displayed

## Acceptance Criteria

- [ ] Returns paginated documents
- [ ] Ordered by analise_critica ascending
- [ ] Search works on titulo
- [ ] Filter by status (V, O, C)
- [ ] Includes revision count

## Backend Behavior

### Endpoints
- `GET /documentos/` — List documents

### Query Parameters
- `search` — Search titulo
- `status` — Filter by status
- `vencido` — Filter expired documents
- `cliente` — Client filter

### Business Rules
- Ordered by analise_critica, pk
- Non-staff filtered to their client
- Includes nested revisions

### Validations
- User must be authenticated

## Data & Permissions

### Entities Touched
- `Documento` — Read
- `Revisao` — Read (nested)

### Permissions
- **Authenticated Users**: View own client's documents
- **Staff Users**: View all documents

## Edge Cases & Failures

### Missing Data
- No client association: Empty list

## Observability

### Logs/Events
- Query logging

### Metrics
- Documents per client

## Open Questions

- [ ] Should external documents be included?

