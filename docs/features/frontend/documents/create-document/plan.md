# Feature: Create Document

## Feature Summary

Form for uploading and registering a new controlled document with metadata.

## User Value

### Problem Solved
New documents need to be registered in the document control system.

### Who Benefits
- **Document Control Specialists**: Register documents
- **Quality Managers**: Ensure coverage

## Scope

### In Scope
- File upload
- Metadata entry (title, code, frequency)
- Validity date setting
- Initial setup

### Out of Scope
- Initial revision workflow
- Template-based creation

## User Flow

### Primary Flow
1. User clicks "Add Document"
2. User uploads file
3. User enters metadata
4. System creates document
5. Redirect to detail page

## Acceptance Criteria

- [ ] File upload required
- [ ] Title and code entry
- [ ] Frequency selection
- [ ] Creates document on save
- [ ] Redirects on success

## Frontend Behavior

### Screens/Components
- `FormCreate.jsx` — Creation form

### Key States
- **Initial**: Empty form
- **Uploading**: File being uploaded
- **Filling**: Metadata entry
- **Saving**: API call
- **Created**: Redirect

## Data & Permissions

### Entities Touched
- `Documento` — Create

### Permissions
- **Create Permission**: Required

## Edge Cases & Failures

### Validation Errors
- Missing file: Show error

## Observability

### Logs/Events
- Document creation logged

## Open Questions

- [ ] Should there be file size limits displayed?

