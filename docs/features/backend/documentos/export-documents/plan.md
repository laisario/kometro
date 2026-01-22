# Feature: Export Documents

## Feature Summary

Exports selected documents to CSV format for external reporting and audit documentation.

## User Value

### Problem Solved
Document control reports may be needed in external formats for audits or management reporting.

### Who Benefits
- **Document Control Specialists**: Generate reports
- **Auditors**: Review document lists

## Scope

### In Scope
- Export selected documents
- CSV format
- Key document fields

### Out of Scope
- File content export
- Revision history export

## User Flow

### Primary Flow
1. User selects documents
2. User triggers export
3. System generates CSV
4. Browser downloads

## Acceptance Criteria

- [ ] Accepts document ID list
- [ ] Returns CSV with document data
- [ ] Uses DocumentoExportResource

## Backend Behavior

### Endpoints
- `POST /documentos/exportar/` — Export documents

### Request Body
```json
{
  "documentos_selecionados": [1, 2, 3]
}
```

### Response
CSV file download with Content-Disposition header.

### Business Rules
- Uses django-import-export
- Exports standard fields

## Data & Permissions

### Entities Touched
- `Documento` — Read

### Permissions
- **Authenticated Users**: Export accessible documents

## Edge Cases & Failures

### Missing Data
- Invalid IDs: Skipped

## Observability

### Logs/Events
- Export: count, user

## Open Questions

- [ ] Should revision data be included?

