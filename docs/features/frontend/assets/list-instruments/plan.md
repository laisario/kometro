# Feature: List Instruments

## Feature Summary

Displays a paginated table of instruments with filtering, search, and sector-based navigation. Includes a sidebar tree view for navigating the sector hierarchy and a data table showing instrument details.

## User Value

### Problem Solved
Users need to efficiently browse, search, and filter through potentially hundreds of instruments to find what they need.

### Who Benefits
- **Quality Managers**: Monitor all instruments
- **Maintenance Supervisors**: Find instruments by area
- **Lab Technicians**: Locate instruments for work

## Scope

### In Scope
- Paginated data table with sorting
- Search by tag, type, manufacturer, model
- Filter by position, expiration status, type
- Sector tree navigation sidebar
- Quick actions (view, edit, position change)

### Out of Scope
- Inline editing
- Drag-and-drop organization

## User Flow

### Primary Flow
1. User navigates to Instrumentos page
2. System loads sector tree and first page of instruments
3. User clicks sector in tree to filter
4. User uses search/filters to narrow results
5. User clicks instrument row to view details

### Alternate Flows

#### Empty State
- No instruments: Show "Nenhum instrumento cadastrado" message
- No search results: Show "Nenhum resultado encontrado"

#### Error State
- API error: Show error alert

## Acceptance Criteria

- [ ] Displays paginated instrument table
- [ ] Sector tree shows hierarchy with instrument counts
- [ ] Search filters across tag, type description, manufacturer, model
- [ ] Position filter dropdown works
- [ ] Clicking sector filters table
- [ ] Clicking row navigates to detail page
- [ ] Export button opens export dialog

## Frontend Behavior

### Screens/Components
- `AssetsPage.jsx` — Main page container
- `SetorTree.jsx` — Sector hierarchy tree sidebar
- `InstrumentosTable.jsx` — Data table with pagination
- `ExportFilter.jsx` — Export configuration dialog
- `TableToolbar.jsx` — Search and filter controls

### Key States
- **Loading**: Spinner during data fetch
- **Empty**: Message when no instruments
- **Error**: Alert on API failure
- **Filtered**: Applied filters shown

### Form Validations
- N/A (read-only view)

## Data & Permissions

### Entities Touched
- `InstrumentoDoCliente` — Read (list)
- `Setor` — Read (hierarchy)

### Permissions
- **All Authenticated Users**: View instruments
- **Staff**: Additional client filter

## Edge Cases & Failures

### Validation Errors
- N/A

### Missing Data
- No instruments: Empty state
- No sectors: Tree not shown

### Permission Denied
- Not authenticated: Redirect to login

### Network/Integration Failures
- API timeout: Error alert with retry option

## Observability

### Logs/Events
- Page load, search queries, filter changes

### Metrics
- Time to first render
- Search frequency

## Open Questions

- [ ] Should there be keyboard navigation in the table?
- [ ] Should filters persist across sessions?

