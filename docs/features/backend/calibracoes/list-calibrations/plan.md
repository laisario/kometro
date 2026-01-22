# Feature: List Calibrations

## Feature Summary

Retrieves calibration records for a specific instrument. Returns either full calibrations or intermediate checks (verifications) based on a query parameter. Results are filtered by instrument ID and ordered by date.

## User Value

### Problem Solved
Users need to view the complete calibration history for an instrument to understand its measurement reliability over time and verify compliance with calibration schedules.

### Who Benefits
- **Quality Managers**: Review calibration history for audits
- **Lab Technicians**: Access previous calibration data for comparison
- **External Auditors**: Verify calibration compliance records

## Scope

### In Scope
- List calibrations for a specific instrument
- Filter between calibrations and verifications (checagem)
- Include related certificates in response
- Include calibration results

### Out of Scope
- Listing calibrations across all instruments
- Aggregated calibration statistics
- Calendar view of calibrations

## User Flow

### Primary Flow
1. User opens instrument detail page
2. User navigates to calibration history tab
3. Frontend requests calibrations for instrument ID
4. System returns calibration records with certificates
5. User reviews calibration history

### Alternate Flows

#### No Calibrations
- New instrument without calibration history
- Returns empty list

#### Verification Mode
- User toggles to view verifications instead of calibrations
- System returns checagem records

## Acceptance Criteria

- [ ] Returns calibrations filtered by instrument_id parameter
- [ ] Separates calibrations from verifications via checagem parameter
- [ ] Includes nested certificates and attachments
- [ ] Includes calibration results with status
- [ ] Returns empty list if no instrument_id provided

## Backend Behavior

### Endpoints
- `GET /calibracoes/` — List calibrations

### Query Parameters
- `instrumento` — Instrument ID (required for list)
- `checagem` — "true" for verifications, "false" for calibrations

### Response
```json
[
  {
    "id": 1,
    "instrumento": 123,
    "data": "2025-01-15",
    "ordem_de_servico": "OS-2025-001",
    "laboratorio": "Lab Acreditado XYZ",
    "analise_critica": "A",
    "certificados": [
      {
        "id": 1,
        "numero": "CERT-2025-001",
        "arquivo": "/media/certificados/cert.pdf",
        "anexos": []
      }
    ],
    "resultados": [
      {
        "status": "A",
        "maior_erro": 0.05,
        "incerteza": 0.02
      }
    ]
  }
]
```

### Business Rules
- If no instrument_id provided, returns empty queryset
- checagem=true filters to verification records
- checagem=false (default) filters to calibration records
- Results include nested serialized relationships

### Validations
- User must be authenticated
- Instrument must exist and be accessible

## Data & Permissions

### Entities Touched
- `Calibracao` — Read
- `Certificado` — Read (nested)
- `Anexo` — Read (nested)
- `ResultadoCalibracao` — Read (nested)

### Permissions
- **Authenticated Users**: View calibrations for own client's instruments
- **Staff Users**: View calibrations for any instrument

## Edge Cases & Failures

### Validation Errors
- Invalid instrument ID: Return empty list

### Missing Data
- No instrument_id: Return empty list
- No calibrations: Return empty list

### Permission Denied
- Viewing another client's instrument calibrations (non-staff): Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Query logging with instrument ID and result count

### Metrics
- Calibration queries per instrument
- Average calibration count per instrument

## Open Questions

- [ ] Should calibrations be paginated for instruments with many records?
- [ ] Should there be a date range filter?

