# Feature: Delete Document

## Feature Summary

Permanently removes a document and its file from storage. Cascades to delete all revisions and approvals.

## User Value

### Problem Solved
Obsolete or incorrect documents need to be removed from the system.

### Who Benefits
- **Document Control Specialists**: Clean up document repository
- **Administrators**: Remove erroneous entries

## Scope

### In Scope
- Delete document record
- Delete file from storage
- Cascade delete revisions

### Out of Scope
- Soft delete / archive
- Bulk deletion

## User Flow

### Primary Flow
1. User selects document
2. User confirms deletion
3. System deletes document and file
4. System cascades to revisions

## Acceptance Criteria

- [ ] Deletes document record
- [ ] Removes file from storage
- [ ] Cascades to revisions and approvals
- [ ] Returns 204 No Content

## Backend Behavior

### Endpoints
- `DELETE /documentos/{id}/` — Delete document

### Business Rules
- File deleted from default_storage
- Cascade deletes revisions
- Cascade deletes approvals

### Validations
- Document must exist

## Data & Permissions

### Entities Touched
- `Documento` — Delete
- `Revisao` — Delete (cascade)
- `Aprovacao` — Delete (cascade)

### Permissions
- **Authenticated Users**: Delete own client's documents
- **Staff Users**: Delete any

## Edge Cases & Failures

### Missing Data
- Document not found: Return 404

### Network/Integration Failures
- Storage error: May leave orphaned record

## Observability

### Logs/Events
- Document deleted: ID, title, user

## Open Questions

- [ ] Should documents with active revisions be deletable?
- [ ] Should soft delete be implemented?

