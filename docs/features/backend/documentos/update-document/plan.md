# Feature: Update Document

## Feature Summary

Updates an existing document's metadata. Recalculates critical analysis days when validity date changes.

## User Value

### Problem Solved
Document metadata may need updates — corrections, status changes, or validity extensions.

### Who Benefits
- **Document Control Specialists**: Maintain accurate records
- **Quality Managers**: Update document status

## Scope

### In Scope
- Update metadata fields
- Recalculate dates
- Change status

### Out of Scope
- File replacement (separate endpoint)
- Creating revisions

## User Flow

### Primary Flow
1. User views document
2. User edits fields
3. System validates and saves
4. System recalculates dates

## Acceptance Criteria

- [ ] Updates specified fields
- [ ] Recalculates analise_critica on date change
- [ ] Returns updated document

## Backend Behavior

### Endpoints
- `PUT /documentos/{id}/` — Full update
- `PATCH /documentos/{id}/` — Partial update

### Business Rules
- Date change triggers recalculation
- Status can be updated directly

### Validations
- Document must exist
- Valid status values

## Data & Permissions

### Entities Touched
- `Documento` — Update

### Permissions
- **Authenticated Users**: Update own client's documents
- **Staff Users**: Update any

## Edge Cases & Failures

### Missing Data
- Document not found: Return 404

## Observability

### Logs/Events
- Document updated: ID, changed fields, user

## Open Questions

- [ ] Should status changes require approval?

