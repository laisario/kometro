# Feature: Add Certificate

## Feature Summary

Adds a calibration certificate to an existing calibration record. Certificates include a certificate number and uploaded file (PDF). Multiple certificates can be attached to a single calibration.

## User Value

### Problem Solved
After calibration, official certificates are issued by the laboratory. These certificates must be stored with the calibration record for compliance, audits, and historical reference.

### Who Benefits
- **Quality Managers**: Store and retrieve official calibration documentation
- **External Auditors**: Access certificate files during inspections
- **Lab Technicians**: Upload and organize certificate files

## Scope

### In Scope
- Add certificate to existing calibration
- Upload certificate file (PDF)
- Store certificate number
- Prevent duplicate certificate uploads

### Out of Scope
- Certificate validation/verification
- OCR extraction of certificate data
- Automatic certificate generation

## User Flow

### Primary Flow
1. User views calibration record
2. User clicks "Add Certificate"
3. User enters certificate number
4. User uploads certificate file
5. System validates no duplicate exists
6. System creates certificate record
7. System returns certificate data

### Alternate Flows

#### Duplicate Certificate
- Certificate with same number already exists for calibration
- System returns 200 with "Certificado já existe" message
- No new record created

## Acceptance Criteria

- [ ] Creates certificate with number and file
- [ ] Associates certificate with calibration
- [ ] Prevents duplicate certificates (same number + calibration)
- [ ] Returns certificate data with 201 on creation
- [ ] Returns 200 with message if duplicate exists
- [ ] Stores file in certificados/ directory

## Backend Behavior

### Endpoints
- `POST /calibracoes/{id}/adicionar_certificado/` — Add certificate

### Request Body (multipart/form-data)
```
numero: "CERT-2025-001"
arquivo: <file upload>
```

### Response (201 Created)
```json
{
  "id": 1,
  "numero": "CERT-2025-001",
  "arquivo": "/media/certificados/cert.pdf",
  "calibracao": 123
}
```

### Business Rules
- Certificate number + calibration must be unique
- File uploaded to `certificados/` storage path
- Both number and arquivo are optional individually
- Duplicate detection based on numero + calibracao

### Validations
- Calibration must exist
- File must be valid upload

## Data & Permissions

### Entities Touched
- `Calibracao` — Read
- `Certificado` — Create

### Permissions
- **Authenticated Users**: Add to own client's calibrations
- **Staff Users**: Add to any calibration

## Edge Cases & Failures

### Validation Errors
- Invalid file format: Accept any (PDF expected but not enforced)

### Missing Data
- Calibration not found: Return 404

### Permission Denied
- Adding to another client's calibration (non-staff): Return 403

### Network/Integration Failures
- File upload failure: Return 400 or 500
- Storage quota exceeded: Return 500

## Observability

### Logs/Events
- Certificate added: calibration ID, certificate number, user
- Duplicate attempt logged

### Metrics
- Certificates uploaded per day
- Storage usage for certificates

## Open Questions

- [ ] Should file type be restricted to PDF only?
- [ ] Should certificate expiration be tracked?
- [ ] Should there be a maximum file size?

