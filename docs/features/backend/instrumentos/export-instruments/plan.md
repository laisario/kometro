# Feature: Export Instruments

## Feature Summary

Exports selected instruments to CSV format with configurable field selection. Users can choose which instruments to export and which fields to include in the export, enabling flexible reporting and data extraction.

## User Value

### Problem Solved
Users need to extract instrument data for external reports, audits, or analysis in spreadsheet software. A configurable export allows them to get exactly the data they need without manual copying.

### Who Benefits
- **Quality Managers**: Generate audit reports with required fields
- **Administrators**: Extract data for management reporting
- **External Auditors**: Receive formatted instrument lists

## Scope

### In Scope
- Export selected instruments (by ID list)
- Configurable field selection
- CSV format output
- Direct download response

### Out of Scope
- Excel format export
- Scheduled/automated exports
- Email delivery of exports
- Export templates saved per user

## User Flow

### Primary Flow
1. User selects instruments to export (checkboxes)
2. User selects fields to include in export
3. User triggers export action
4. System generates CSV with selected data
5. Browser downloads CSV file

### Alternate Flows

#### No Instruments Selected
- Frontend should validate at least one instrument selected
- Backend returns empty CSV if empty list sent

#### No Fields Selected
- Export all default fields
- Or return error (TBD)

## Acceptance Criteria

- [ ] Accepts list of instrument IDs to export
- [ ] Accepts list of field names to include
- [ ] Returns CSV file with Content-Disposition header
- [ ] Only includes requested fields in output
- [ ] Filename includes "instrumentos_exportados.csv"
- [ ] Handles special characters in data correctly (UTF-8)

## Backend Behavior

### Endpoints
- `POST /instrumentos/exportar/` — Export instruments to CSV

### Request Body
```json
{
  "instrumentos_selecionados": [
    {"id": 1},
    {"id": 2},
    {"id": 3}
  ],
  "campos_selecionados": [
    "tag",
    "numero_de_serie",
    "posicao",
    "data_proxima_calibracao"
  ]
}
```

### Response Headers
```
Content-Type: text/csv
Content-Disposition: attachment; filename="instrumentos_exportados.csv"
```

### Available Export Fields
- `tag` — Instrument tag
- `numero_de_serie` — Serial number
- `posicao` — Position status
- `data_proxima_calibracao` — Next calibration date
- `data_ultima_calibracao` — Last calibration date
- `instrumento__tipo_de_instrumento__descricao` — Instrument type
- `instrumento__tipo_de_instrumento__fabricante` — Manufacturer
- `setor__nome` — Sector name
- `cliente__empresa__razao_social` — Client company name

### Business Rules
- Uses django-import-export InstrumentoExportResource
- Field selection passed to resource class
- Empty ID list returns empty CSV
- Large exports should be handled efficiently

### Validations
- User must be authenticated
- Instrument IDs must exist (non-existent silently skipped)

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read
- Related entities via joins for field values

### Permissions
- **Authenticated Users**: Can export own client's instruments
- **Staff Users**: Can export any instruments

## Edge Cases & Failures

### Validation Errors
- Invalid field names: Silently ignored or error (TBD)

### Missing Data
- Non-existent instrument IDs: Silently filtered out

### Permission Denied
- Attempting to export another client's instruments: Filtered out

### Network/Integration Failures
- Large export timeout: Return 504 or partial results

## Observability

### Logs/Events
- Export event: user ID, count exported, fields selected
- Large export warnings (>1000 records)

### Metrics
- Exports per user/period
- Average export size
- Most requested export fields

## Open Questions

- [ ] Should there be a maximum number of instruments per export?
- [ ] Should export templates be saveable?
- [ ] Should Excel format be supported?

