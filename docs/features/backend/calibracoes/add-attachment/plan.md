# Feature: Add Attachment

## Feature Summary

Adds an additional attachment file to an existing certificate. Attachments can include supporting documentation such as measurement data sheets, uncertainty budgets, or traceability documents.

## User Value

### Problem Solved
Certificates often come with supporting documentation that provides additional detail. Users need to store these alongside the primary certificate for complete documentation.

### Who Benefits
- **Quality Managers**: Maintain complete calibration documentation
- **Auditors**: Access supporting evidence
- **Lab Technicians**: Organize related documents

## Scope

### In Scope
- Add attachment to existing certificate
- Upload file
- Prevent duplicate attachments

### Out of Scope
- Attachment preview
- Attachment versioning
- Bulk attachment upload

## User Flow

### Primary Flow
1. User views certificate
2. User clicks "Add Attachment"
3. User uploads file
4. System validates no duplicate
5. System creates attachment record
6. System returns attachment data

### Alternate Flows

#### Duplicate Attachment
- Same file already attached to certificate
- Returns 200 with "Arquivo já anexado" message

#### No File Provided
- Returns 400 with error message

## Acceptance Criteria

- [ ] Creates attachment linked to certificate
- [ ] Stores file in certificados/anexos/ directory
- [ ] Prevents duplicate attachments
- [ ] Returns 201 on creation, 200 on duplicate
- [ ] Returns 400 if no file provided

## Backend Behavior

### Endpoints
- `PATCH /calibracoes/anexar/` — Add attachment

### Request Body (multipart/form-data)
```
certificado: 1
anexo: <file upload>
```

### Response (201 Created)
```json
{
  "id": 1,
  "anexo": "/media/certificados/anexos/doc.pdf",
  "certificado": 1
}
```

### Business Rules
- Duplicate detection based on file path + certificate
- File uploaded to `certificados/anexos/` storage path
- Certificate must exist

### Validations
- `certificado` — Required, must exist
- `anexo` — Required, must be file upload

## Data & Permissions

### Entities Touched
- `Certificado` — Read
- `Anexo` — Create

### Permissions
- **Authenticated Users**: Add to own client's certificates
- **Staff Users**: Add to any certificate

## Edge Cases & Failures

### Validation Errors
- Missing file: Return 400 "Faltou o arquivo para anexar"

### Missing Data
- Certificate not found: Return 400 or 404

### Permission Denied
- Adding to another client's certificate (non-staff): Return 403

### Network/Integration Failures
- Upload failure: Return 500
- Storage error: Return 500

## Observability

### Logs/Events
- Attachment added: certificate ID, user
- Duplicate attempts logged

### Metrics
- Attachments per certificate
- Storage usage

## Open Questions

- [ ] Should there be a limit on attachments per certificate?
- [ ] Should file types be restricted?

