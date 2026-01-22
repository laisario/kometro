# Feature: Create Document

## Feature Summary

Creates a new controlled document with metadata and uploaded file. Sets initial validity period based on frequency and calculates critical analysis days.

## User Value

### Problem Solved
Organizations need to register new controlled documents to maintain quality management compliance and track review schedules.

### Who Benefits
- **Document Control Specialists**: Register new documents
- **Quality Managers**: Ensure document coverage

## Scope

### In Scope
- Create document with file upload
- Set validity period
- Calculate critical analysis date
- Associate with client and procedure

### Out of Scope
- Initial revision creation
- Approval workflow at creation

## User Flow

### Primary Flow
1. User prepares document
2. User enters metadata
3. User uploads file
4. System creates document
5. System calculates dates

## Acceptance Criteria

- [ ] Creates document with uploaded file
- [ ] Calculates analise_critica from data_validade
- [ ] Associates with client and procedure
- [ ] Returns created document

## Backend Behavior

### Endpoints
- `POST /documentos/` — Create document

### Request Body (multipart)
```
titulo: "Procedimento de Calibração"
codigo: 1
status: "V"
data_validade: "2026-01-15"
frequencia: 1
arquivo: <file>
cliente: 1
```

### Business Rules
- analise_critica calculated as days until data_validade
- frequencia in years
- Files stored in documentos/ path

### Validations
- arquivo required
- Valid status choice
- Client must exist

## Data & Permissions

### Entities Touched
- `Documento` — Create

### Permissions
- **Authenticated Users**: Create for own client
- **Staff Users**: Create for any client

## Edge Cases & Failures

### Validation Errors
- Missing file: Return 400

### Missing Data
- Invalid client: Return 400

## Observability

### Logs/Events
- Document created: ID, title, user

### Metrics
- Documents created per period

## Open Questions

- [ ] Should initial approvers be set at creation?

