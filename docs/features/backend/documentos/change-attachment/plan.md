# Feature: Change Attachment

## Feature Summary

Replaces a document's file attachment. Deletes the old file from storage and saves the new one.

## User Value

### Problem Solved
Documents may need file updates without creating new document records.

### Who Benefits
- **Document Control Specialists**: Update document files
- **Quality Managers**: Maintain current documents

## Scope

### In Scope
- Replace existing file
- Delete old file from storage
- Update document record

### Out of Scope
- Version tracking
- File comparison

## User Flow

### Primary Flow
1. User views document
2. User uploads new file
3. System deletes old file
4. System saves new file

## Acceptance Criteria

- [ ] Deletes existing file
- [ ] Saves new file
- [ ] Updates document record
- [ ] Returns success

## Backend Behavior

### Endpoints
- `PATCH /documentos/{id}/alterar_anexo/` — Replace file

### Request Body (multipart)
```
arquivo: <new file>
```

### Business Rules
- Old file deleted via default_storage
- New file replaces documento.arquivo

### Validations
- Document must exist
- File must be provided

## Data & Permissions

### Entities Touched
- `Documento` — Update
- Storage — Delete old, save new

### Permissions
- **Authenticated Users**: Update own client's documents
- **Staff Users**: Update any

## Edge Cases & Failures

### Missing Data
- Document not found: Return 404

### Network/Integration Failures
- Storage error: May leave inconsistent state

## Observability

### Logs/Events
- File replaced: document ID, user

## Open Questions

- [ ] Should this create a revision?
- [ ] Should old files be archived?

