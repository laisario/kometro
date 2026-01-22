# Feature: Export Movimentations

## Feature Summary

Exports the complete movement history (position changes) for a specific instrument to CSV format. Provides a traceable audit trail of all position transitions for compliance and reporting purposes.

## User Value

### Problem Solved
Auditors and quality managers need documented evidence of instrument movements for compliance reviews. This feature provides a downloadable record of all position changes with timestamps and responsible users.

### Who Benefits
- **Quality Managers**: Provide movement audit trails during inspections
- **External Auditors**: Review instrument traceability documentation
- **Compliance Officers**: Verify proper instrument handling procedures

## Scope

### In Scope
- Export all movements for a single instrument
- Include old position, new position, date, user
- CSV format output
- Direct download response

### Out of Scope
- Bulk export across multiple instruments
- Excel format
- Custom date range filtering
- Sector movements (separate feature)

## User Flow

### Primary Flow
1. User views instrument details
2. User clicks export movements button
3. System queries all movements for instrument
4. System generates CSV with movement history
5. Browser downloads CSV file

### Alternate Flows

#### No Movements Exist
- Returns CSV with headers only
- Or empty file

## Acceptance Criteria

- [ ] Accepts instrument ID as path parameter
- [ ] Returns all MovimentacaoInstrumento records for instrument
- [ ] CSV includes: date, old position, new position, user
- [ ] Ordered by date (newest or oldest first)
- [ ] Filename includes instrument ID
- [ ] Returns 404 if instrument not found

## Backend Behavior

### Endpoints
- `GET /instrumentos/{id}/exportar_movimentacoes/` — Export movements

### Response Headers
```
Content-Type: text/csv
Content-Disposition: attachment; filename="relatorio_movimentacoes_{id}.csv"
```

### CSV Columns
| Column | Description |
|--------|-------------|
| Data da Alteração | Timestamp of position change |
| Posição Anterior | Previous position code and label |
| Nova Posição | New position code and label |
| Usuário | Username who made the change |

### Business Rules
- Uses django-import-export RelatorioMovimentacoesResource
- Ordered by data_alteracao descending
- Position codes translated to readable labels

### Validations
- Instrument must exist
- User must have permission to view instrument

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read (verify exists)
- `MovimentacaoInstrumento` — Read

### Permissions
- **Authenticated Users**: Can export own client's instrument movements
- **Staff Users**: Can export any instrument's movements

## Edge Cases & Failures

### Validation Errors
- N/A (no input validation beyond ID)

### Missing Data
- Instrument not found: Return 404
- No movements: Return CSV with headers only

### Permission Denied
- Exporting another client's instrument (non-staff): Return 403

### Network/Integration Failures
- Database error: Return 500

## Observability

### Logs/Events
- Export event: instrument ID, user ID, record count

### Metrics
- Movement exports per period
- Average records per export

## Open Questions

- [ ] Should sector movements be included in same export?
- [ ] Should date range filtering be added?
- [ ] Should export include more instrument details (tag, type)?

