# Feature: Ordens de Serviço

## Feature Summary

Displays a list of all Ordens de Serviço (OS) for managers, allowing them to assign responsáveis (responsible staff members) and expiration dates. Each OS row can be clicked to view detailed information and associated instruments. The page also maintains a persistent view of team members (staff) for reference and navigation.

## User Value

### Problem Solved
Managers need to oversee all Ordens de Serviço, assign responsibilities, set expiration dates, and quickly access detailed information including associated instruments. They also need visibility into team members to make informed assignment decisions.

### Who Benefits
- **Gerente (Manager)**: Can manage OS assignments, track responsibilities, set deadlines, and view instrument associations

## Scope

### In Scope
- List all Ordens de Serviço with key information (número, proposta, cliente, responsável, data de expiração)
- Inline assignment/update of responsável directly in the OS list
- Inline assignment/update of data de expiração directly in the OS list
- Click OS row to open dialog/modal with detailed information
- Display associated instruments (identified by tag) in the details dialog
- Persistent list of team members (staff) as part of the page UI (as section, side panel, tab, or block)
- Loading, empty, and error states for OS list
- Loading, empty, and error states for details dialog
- Visual feedback (loading/error) per row when updating responsável or expiração
- Error handling with rollback and retry for failed updates

### Out of Scope
- Create/edit OS manually (OS are created automatically on proposal approval)
- Delete OS
- Filter/search OS (future enhancement)
- Pagination (future enhancement)
- Bulk operations on OS
- Create/edit staff users
- Filter/search staff members

## User Flow

### Primary Flow
1. Manager navigates to `/admin/equipe` (rota da página principal de OS)
2. System displays list of Ordens de Serviço with columns: Número, Proposta, Cliente, Responsável, Data de Expiração
3. System displays team members list (as section/panel/tab/block) for reference
4. Manager assigns/updates responsável for an OS:
   - Clicks on responsável cell/control in the row
   - Selects staff member from dropdown
   - System shows loading indicator on that row
   - System saves update via API
   - On success: Updates UI, shows success feedback
   - On error: Rolls back visual state, shows error message inline/toast, allows retry
5. Manager assigns/updates data de expiração for an OS:
   - Clicks on data de expiração cell/control in the row
   - Selects date from date picker
   - System shows loading indicator on that row
   - System saves update via API
   - On success: Updates UI, shows success feedback
   - On error: Rolls back visual state, shows error message inline/toast, allows retry
6. Manager clicks on an OS row
7. System opens dialog/modal with OS details
8. System displays OS information (número, proposta, cliente, responsável, data de expiração)
9. System displays associated instruments list (showing tag for each instrument)
10. Manager can close dialog to return to list

### Alternate Flows

#### Empty State - OS List
- No OS found: Show "Nenhuma ordem de serviço encontrada" with EmptyYet component

#### Empty State - Instruments in Dialog
- OS has no instruments: Show "Nenhum instrumento associado" in dialog

#### Error State - OS List
- API error loading OS: Show error message with retry button

#### Error State - Dialog
- API error loading OS details: Show error message in dialog with retry option

#### OS Without Responsável
- Display "Não atribuído" in responsável column
- Allow assignment via dropdown

#### OS Without Data de Expiração
- Display "Sem expiração" in data de expiração column
- Allow assignment via date picker

#### Update Failure
- Show error toast/message with specific error detail
- Rollback visual state to previous value
- Allow user to retry the operation

## Acceptance Criteria

- [ ] Page accessible only to users with "gerente" group
- [ ] Lists all Ordens de Serviço from API endpoint
- [ ] Each OS row displays: número, proposta número, cliente nome, responsável (or "Não atribuído"), data de expiração (or "Sem expiração")
- [ ] Responsável column allows inline assignment/update via dropdown/select
- [ ] Data de expiração column allows inline assignment/update via date picker
- [ ] Clicking OS row opens dialog/modal with detailed information
- [ ] Dialog displays OS details and associated instruments (showing tag for each)
- [ ] Team members list is displayed persistently on the page (as section/panel/tab/block)
- [ ] Loading spinner while fetching OS list
- [ ] Loading indicator per row when updating responsável or expiração
- [ ] Loading spinner in dialog while fetching OS details
- [ ] Empty state when no OS found
- [ ] Empty state in dialog when no instruments associated
- [ ] Error state with retry button when API fails
- [ ] Error handling with rollback and retry for failed updates
- [ ] Success feedback (toast/notification) when update succeeds
- [ ] Error feedback (toast/notification) when update fails

## Frontend Behavior

#### Screens/Components
- `OrdensServicoPage` (or `EquipePage`) — Main page component displaying OS list and team members
- `OrdensServicoTable` / `OrdensServicoList` — Table/list component for OS rows
- `OrdemServicoRow` — Row component for each OS with inline editing controls
- `ResponsavelSelect` / `AssignResponsavelControl` — Dropdown/select component for assigning responsável inline
- `ExpiracaoDatePicker` / `AssignExpiracaoControl` — Date picker component for assigning data de expiração inline
- `OrdemServicoDetailsDialog` — Dialog/modal component showing OS details and instruments
- `InstrumentTagList` — Component displaying list of instrument tags in dialog
- `TeamMembersPanel` / `TeamMembersList` — Component displaying persistent list of team members (staff)

#### Key States - OS List
- Loading: CircularProgress centered while fetching OS list
- Empty: EmptyYet component with "Nenhuma ordem de serviço encontrada"
- Error: Error message with retry button
- Success: Table/list of OS with inline editing controls
- Updating: Loading indicator per row when saving responsável or expiração

#### Key States - Details Dialog
- Loading: CircularProgress in dialog while fetching OS details
- Empty instruments: "Nenhum instrumento associado" message
- Error: Error message in dialog with retry option
- Success: OS details and instruments list displayed

#### Key States - Team Members List
- Loading: Loading indicator while fetching staff members
- Empty: Empty state or hidden if no staff members
- Success: List of staff members displayed persistently

## Data & Permissions

### Backend Endpoints
- `GET /api/ordens-servico/` — List all OS (requires staff permission)
- `GET /api/ordens-servico/:id/` — Get OS detail with instruments (requires staff permission)
- `PATCH /api/ordens-servico/:id/` — Update OS (responsavel, data_expiracao) (requires gerente permission)
- `GET /api/users/?is_staff=true` — List staff members (for responsável dropdown and team members list)

### Request/Response Examples

#### GET /api/ordens-servico/
Response:
```json
{
  "results": [
    {
      "id": 1,
      "numero": "OS-001",
      "proposta_numero": "PROP-001",
      "cliente_nome": "Empresa ABC",
      "responsavel": 5,
      "responsavel_nome": "João Silva",
      "data_expiracao": "2024-12-31",
      "data_criacao": "2024-01-15T10:00:00Z",
      "instrumentos_count": 3
    }
  ]
}
```

#### GET /api/ordens-servico/:id/
Response:
```json
{
  "id": 1,
  "numero": "OS-001",
  "proposta_numero": "PROP-001",
  "cliente_nome": "Empresa ABC",
  "responsavel": 5,
  "responsavel_nome": "João Silva",
  "data_expiracao": "2024-12-31",
  "data_criacao": "2024-01-15T10:00:00Z",
  "instrumentos_count": 3,
  "instrumentos": [
    {
      "id": 10,
      "tag": "TAG-001",
      "instrumento": {
        "tipoDeInstrumento": {
          "descricao": "Termômetro"
        }
      }
    }
  ]
}
```

#### PATCH /api/ordens-servico/:id/
Request:
```json
{
  "responsavel": 5,
  "data_expiracao": "2024-12-31"
}
```

### Entities Touched
- `OrdemServico` — Read (list, detail), Update (responsavel, data_expiracao)
- `User` — Read (filter is_staff=true for responsável options and team list)
- `InstrumentoDoCliente` — Read (via OS detail endpoint)

### Permissions
- **Gerente**: Full access (view OS list, view details, update responsável and expiração)
- **Other staff**: Can view OS list and details, but cannot update (redirect or hide edit controls)
- **Non-staff**: Redirect to 404 or /eu

## Edge Cases & Failures

### Validation Errors
- Invalid responsável ID: Show error "Responsável inválido"
- Invalid date format: Show error "Data de expiração inválida"
- Past expiration date: Allow but show warning (or validate on backend)

### Missing Data
- OS without responsável: Display "Não atribuído" and allow assignment
- OS without data de expiração: Display "Sem expiração" and allow assignment
- OS without instruments: Display "Nenhum instrumento associado" in dialog
- Instrument without tag: Display "Sem tag" or fallback identifier
- User has no name: Display email as fallback in responsável dropdown

### Permission Denied
- Non-gerente trying to update: Show error "Apenas gerentes podem editar ordens de serviço"
- Non-staff trying to view: Redirect to /404 or /eu

### Network/Integration Failures
- API timeout loading OS list: Show error with retry button
- API timeout loading OS details: Show error in dialog with retry option
- API failure updating responsável: Rollback visual state, show error toast, allow retry
- API failure updating expiração: Rollback visual state, show error toast, allow retry
- Partial network failure: Handle gracefully, show partial data if available

### Concurrent Updates
- Another user updates same OS: Refresh data after update to show latest state
- Optimistic updates: Show immediate feedback, rollback if API fails

## Observability

### Logs/Events
- Page load: Track "ordens_servico_page_view"
- Assign responsável: Track "assign_os_responsavel" with OS ID and responsável ID
- Assign expiração: Track "assign_os_expiracao" with OS ID and date
- Open details dialog: Track "open_os_details_dialog" with OS ID
- Update success: Track "update_os_success" with OS ID and field updated
- Update failure: Track "update_os_failure" with OS ID, field, and error message
- Retry action: Track "retry_os_update" with OS ID

### Metrics to Monitor
- OS list load time
- OS details dialog load time
- Update responsável success rate
- Update expiração success rate
- Average time to assign responsável
- Average time to assign expiração
- Error rate for OS operations

## Open Questions

- [ ] What is the exact route for the main OS page? (Currently `/admin/equipe` or should it be `/admin/ordens-servico`?)
- [ ] How should team members be displayed? (Side panel, tab, section, or block?)
- [ ] Should there be a visual distinction between OS with and without responsável assigned?
- [ ] Should there be a visual distinction between OS with and without expiração?
- [ ] Should expired OS be highlighted differently?
- [ ] Should we show OS count per staff member in the team members list?
- [ ] Should we add search/filter for OS in future iteration?
- [ ] Should we add pagination for OS list in future iteration?
- [ ] Should we allow bulk assignment of responsável or expiração?
- [ ] Should we show instrument count in the OS list row, or only in details dialog?
