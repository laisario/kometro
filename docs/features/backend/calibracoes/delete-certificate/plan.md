# Feature: Delete Certificate

## Feature Summary

Removes a certificate from a calibration record. This permanently deletes the certificate record and its associated file from storage. Cascade deletes any attachments.

## User Value

### Problem Solved
Certificates may be uploaded in error or need to be replaced. Users need the ability to remove incorrect certificates from calibration records.

### Who Benefits
- **Lab Technicians**: Correct data entry mistakes
- **Administrators**: Clean up erroneous uploads
- **Quality Managers**: Maintain accurate records

## Scope

### In Scope
- Delete certificate record
- Delete associated file from storage
- Cascade delete attachments

### Out of Scope
- Soft delete / archive
- Certificate replacement workflow
- Bulk certificate deletion

## User Flow

### Primary Flow
1. User views calibration certificates
2. User selects certificate to delete
3. User confirms deletion
4. System deletes certificate and attachments
5. System returns success message

### Alternate Flows

#### Certificate Not Found
- Certificate ID doesn't exist
- Returns 400 with error message

#### Missing ID
- No certificate ID provided
- Returns 400 "Faltou o id"

## Acceptance Criteria

- [ ] Deletes certificate by ID
- [ ] Cascades to delete attachments
- [ ] Returns success message on deletion
- [ ] Returns 400 if certificate not found
- [ ] Returns 400 if ID not provided

## Backend Behavior

### Endpoints
- `POST /calibracoes/{calibracao_id}/apagar_certificado/` — Delete certificate

### Request Body
```json
{
  "id": 1
}
```

### Response (200 OK)
```json
{
  "message": "Certificado removido!"
}
```

### Business Rules
- Certificate must exist
- Deletes certificate record (file storage cleanup may be separate)
- All attachments deleted via cascade

### Validations
- `id` — Required
- Certificate must exist

## Data & Permissions

### Entities Touched
- `Certificado` — Delete
- `Anexo` — Delete (cascade)

### Permissions
- **Authenticated Users**: Delete from own client's calibrations
- **Staff Users**: Delete from any calibration

## Edge Cases & Failures

### Validation Errors
- Missing ID: Return 400 "Faltou o id"
- Invalid ID: Return 400 "Certificado não existe"

### Missing Data
- Certificate not found: Return 400

### Permission Denied
- Deleting from another client's calibration (non-staff): Return 403

### Network/Integration Failures
- Database error: Return 500
- Storage deletion error: May succeed with orphaned file

## Observability

### Logs/Events
- Certificate deletion: certificate ID, calibration ID, user
- Storage cleanup status

### Metrics
- Certificates deleted per period
- Reason for deletion (if tracked)

## Open Questions

- [ ] Should certificate deletion require additional confirmation?
- [ ] Should deleted certificates be archived?
- [ ] Should file storage cleanup be synchronous or async?

