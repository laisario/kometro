# Feature: Export Proposals

## Feature Summary

Exports selected proposals to CSV format for external reporting and analysis.

## User Value

### Problem Solved
Commercial teams need to extract proposal data for reports, analysis, and external systems.

### Who Benefits
- **Commercial Managers**: Generate reports
- **Administrators**: Export data for analysis

## Scope

### In Scope
- Export selected proposals by ID
- CSV format output
- Key proposal fields

### Out of Scope
- Field selection
- Excel format
- Scheduled exports

## User Flow

### Primary Flow
1. User selects proposals to export
2. User triggers export
3. System generates CSV
4. Browser downloads file

### Alternate Flows

#### Empty Selection
- Returns CSV with headers only

## Acceptance Criteria

- [ ] Accepts list of proposal IDs
- [ ] Returns CSV with proposal data
- [ ] Content-Disposition header set
- [ ] Uses PropostaExportResource

## Backend Behavior

### Endpoints
- `POST /propostas/exportar/` — Export proposals

### Request Body
```json
{
  "propostas_selecionadas": [1, 2, 3]
}
```

### Response
```
Content-Type: text/csv
Content-Disposition: attachment; filename="propostas_exportadas.csv"
```

### Business Rules
- Uses django-import-export
- Exports all resource fields

### Validations
- User authenticated

## Data & Permissions

### Entities Touched
- `Proposta` — Read

### Permissions
- **Authenticated Users**: Export accessible proposals
- **Staff Users**: Export any proposals

## Edge Cases & Failures

### Missing Data
- Invalid IDs: Skipped silently

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Export: count, user

### Metrics
- Exports per period

## Open Questions

- [ ] Should field selection be configurable?

