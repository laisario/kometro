# Feature: Download PDF

## Feature Summary

Downloads the latest revision's PDF document for a proposal. Returns the PDF file directly for browser download.

## User Value

### Problem Solved
Users need to access the generated proposal PDF for printing, sharing, or archival.

### Who Benefits
- **Commercial Managers**: Download for offline access
- **Clients**: Save proposal documents
- **Auditors**: Access historical proposals

## Scope

### In Scope
- Download latest revision PDF
- Direct file download response

### Out of Scope
- Specific revision selection
- PDF regeneration
- Preview without download

## User Flow

### Primary Flow
1. User opens proposal
2. User clicks download
3. System retrieves latest revision PDF
4. Browser downloads file

### Alternate Flows

#### No PDF Available
- No revisions exist
- Return 404 error

## Acceptance Criteria

- [ ] Returns latest revision's PDF file
- [ ] Content-Type set to application/pdf
- [ ] Content-Disposition triggers download
- [ ] Filename includes proposal ID
- [ ] Returns 404 if no PDF exists

## Backend Behavior

### Endpoints
- `GET /propostas-files/{id}/` — Download PDF

### Response Headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="proposta{id}.pdf"
```

### Business Rules
- Retrieves proposta.revisoes.last().pdf
- Opens file and returns content
- Closes file handle after read

### Validations
- Proposal must exist
- Revision with PDF must exist

## Data & Permissions

### Entities Touched
- `Proposta` — Read
- `Revisao` — Read (PDF file)

### Permissions
- **Open**: No authentication required for this ViewSet

## Edge Cases & Failures

### Validation Errors
- N/A

### Missing Data
- Proposal not found: Return 404
- No revision/PDF: Return 404 "file not existent"

### Network/Integration Failures
- File storage error: Return 500

## Observability

### Logs/Events
- Download: proposal ID, user (if authenticated)

### Metrics
- Downloads per proposal
- Total download volume

## Open Questions

- [ ] Should authentication be required?
- [ ] Should download count be tracked?
- [ ] Should old revisions be downloadable?

