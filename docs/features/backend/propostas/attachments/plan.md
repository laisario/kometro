# Feature: Attachments

## Feature Summary

Manages file attachments on proposals. Supports adding and removing files that supplement the main proposal document.

## User Value

### Problem Solved
Proposals may need supporting documents like terms, specifications, or additional information.

### Who Benefits
- **Commercial Managers**: Add supporting materials
- **Clients**: Receive complete proposal packages

## Scope

### In Scope
- Add attachment to proposal
- Remove attachment from proposal
- Prevent duplicates

### Out of Scope
- Attachment versioning
- Bulk operations

## User Flow

### Primary Flow (Add)
1. Staff opens proposal
2. Staff uploads attachment
3. System validates unique
4. System creates attachment record

### Primary Flow (Remove)
1. Staff views attachments
2. Staff removes attachment
3. System deletes record

## Acceptance Criteria

- [ ] Adds attachment with file upload
- [ ] Prevents duplicate file attachment
- [ ] Removes attachment by ID
- [ ] Returns appropriate status codes

## Backend Behavior

### Endpoints
- `PATCH /propostas/{id}/anexar/` — Add attachment
- `PATCH /propostas/{id}/desanexar/` — Remove attachment

### Request (Add)
```
anexo: <file>
```

### Request (Remove)
```json
{
  "anexo": 1
}
```

### Business Rules
- Duplicates checked by file reference
- Files stored in anexos/ path

### Validations
- Staff only for both operations
- File required for add
- ID required for remove

## Data & Permissions

### Entities Touched
- `Anexo` — Create/Delete
- `Proposta` — Read

### Permissions
- **Staff Users Only**: Manage attachments

## Edge Cases & Failures

### Validation Errors
- Missing file: Return 400

### Missing Data
- Attachment not found: Return 400

### Permission Denied
- Non-admin: Return 403

## Observability

### Logs/Events
- Add/remove: proposal ID, user

### Metrics
- Attachments per proposal

## Open Questions

- [ ] Should max attachment count be enforced?
- [ ] Should file types be restricted?

