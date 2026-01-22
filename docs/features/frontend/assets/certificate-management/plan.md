# Feature: Certificate Management

## Feature Summary

Interface for uploading, viewing, and downloading calibration certificates attached to calibration records.

## User Value

### Problem Solved
Calibration certificates must be stored and accessible for compliance and audit purposes.

### Who Benefits
- **Lab Technicians**: Upload certificates
- **Quality Managers**: Access documentation
- **Auditors**: Download certificates

## Scope

### In Scope
- Upload certificate files
- Enter certificate number
- View certificate list
- Download certificates
- Delete certificates

### Out of Scope
- Certificate validation
- OCR extraction
- Certificate generation

## User Flow

### Primary Flow (Upload)
1. User views calibration
2. User clicks "Add Certificate"
3. User enters number and selects file
4. System uploads and stores
5. Certificate appears in list

### Primary Flow (Download)
1. User clicks certificate
2. Browser downloads file

## Acceptance Criteria

- [ ] Upload accepts PDF files
- [ ] Certificate number stored
- [ ] Files downloadable
- [ ] Delete removes certificate
- [ ] Multiple certificates per calibration

## Frontend Behavior

### Screens/Components
- `Certificates.jsx` — Certificate list and upload
- `FormCertificate.jsx` — Upload form

### Key States
- **Empty**: No certificates
- **List**: Certificates shown
- **Uploading**: Progress indicator
- **Error**: Upload failure

## Data & Permissions

### Entities Touched
- `Certificado` — CRUD
- `Anexo` — CRUD (attachments)

### Permissions
- **View**: All authenticated
- **Upload/Delete**: Edit permission

## Edge Cases & Failures

### Validation Errors
- Invalid file: Error message

### Network/Integration Failures
- Upload failure: Error toast

## Observability

### Logs/Events
- Uploads and downloads logged

## Open Questions

- [ ] Should file size limits be enforced?

