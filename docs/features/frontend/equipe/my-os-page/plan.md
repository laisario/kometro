# Feature: My OS Page (Minhas Ordens de Servico)

> **Version**: 2.0  
> **Status**: Deprecated - Migrating to Unified OS Page  
> **Date**: 2025-01-XX  
> **Migration Target**: [Unified OS Page with Tabs](../unified-os-page-with-tabs/plan.md)  
> **Related**: [Team List Feature](../team-list/plan.v2.md)

## ⚠️ Deprecation Notice

**This feature is being deprecated and will be merged into the unified service orders page.**

The `/admin/eu` route and `MinhasOSPage` component will be removed in favor of a tab-based interface in `/admin/ordens-servico`. 

**Migration Plan**: See [Unified OS Page with Tabs](../unified-os-page-with-tabs/plan.md) for the new architecture.

**Timeline**: 
- Phase 1: Implement tabs in `/admin/ordens-servico` (in progress)
- Phase 2: Remove `/admin/eu` route and `MinhasOSPage` component (after migration complete)

## Feature Summary

Personal page for staff users to view all OrdemServico they are responsible for. The page uses the same UI components and layout as the Equipe page, but without the employee list card. It shows a summary card with OS status distribution and a table with the same columns and behavior as the Equipe page.

## User Value

### Problem Solved
Staff members need a dedicated place to see their assigned work orders without navigating through proposals or other areas. The page provides a consistent experience with the Equipe page, making it easy for users to understand and navigate.

### Who Benefits
- **Lab Technicians**: See their workload at a glance
- **Staff Members**: Track their assigned calibrations
- **Managers**: Can view their own OS using the same interface as team management

## Scope

### In Scope
- List all OS where current user is responsavel
- Show OS summary card with status distribution (same as Equipe page)
- Display OS table with columns: OS, Cliente, Expiração, Tipo, Status
- Expiration date is display-only (read-only, no editing)
- Click OS row to open details dialog (same as Equipe page)
- Pagination support
- Loading, empty, and error states

### Out of Scope
- Edit OS assignments
- Change responsavel
- Create new OS manually
- Employee list card (only in Equipe page)
- Inline editing of expiration dates

## UX Layout Description

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  /eu (Minhas OS)                                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  OS SUMMARY (Horizontal Row)                                 │
│  [Todos: 12] [A realizar: 0] [EA: 3] [Finalizadas: 9]      │
│                                                               │
│  OS TABLE                                                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │ OS | Cliente | Expiração | Tipo | Status         │      │
│  ├────────────────────────────────────────────────────┤      │
│  │ OS-001 | ABC | 31/12 | CAL | AR                  │      │
│  │ OS-002 | XYZ | 15/01 | BAL | EA                  │      │
│  │ ...                                               │      │
│  └──────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Layout Details

#### OS Summary Row
- **Position**: Above OS table
- **Layout**: Horizontal row with status counts
- **Content**: 
  - Todos (total count)
  - A realizar (count)
  - Em andamento (count)
  - Finalizadas (count)
- **Behavior**: Shows counts for logged-in user's OS only
- **Component**: `OSSummaryRow` (shared with Equipe page)

#### OS Table
- **Position**: Below summary row
- **Columns**: OS, Cliente, Expiração, Tipo, Status
- **Behavior**: 
  - Filtered to show only OS where responsavel = current user
  - Row click opens details dialog
  - Expiration date is read-only (display-only)
  - Pagination support
- **Component**: `OSTable` (shared with Equipe page)

## Interaction Rules

### OS Table Interactions

#### Row Click
- Opens details dialog with OS information and associated instruments
- Same behavior as Equipe page
- Uses the same `OrdemServicoDetailsDialog` component

#### Expiration Date
- Display-only (read-only, no editing)
- Color-coded based on expiration status:
  - Red: Expired
  - Orange: Expiring within 7 days
  - Default: Valid

### Data Filtering

#### Automatic Filtering
- Data is automatically filtered to show only OS where:
  - `responsavel = current_user.id`
- Filtering happens at the API level via `GET /api/ordens-servico/minhas/`
- Summary card reflects the same filtered dataset

## Data Flow

### Initial Load
1. Page loads → Fetch user's OS (`GET /api/ordens-servico/minhas/`)
2. Calculate status distribution from fetched OS
3. Render summary card with counts
4. Render OS table with filtered data

### OS Details Flow
1. User clicks OS row
2. Dialog opens with OS details
3. Dialog fetches full OS data with instruments (`GET /api/ordens-servico/:id/`)
4. User can close dialog to return to table

## API Dependencies

### Backend Endpoints

#### Get My OS
- **Endpoint**: `GET /api/ordens-servico/minhas/`
- **Purpose**: Fetch all OS where current user is responsavel
- **Response**: Array of OS objects
- **Authentication**: Required (staff user)

#### Get OS Detail
- **Endpoint**: `GET /api/ordens-servico/:id/`
- **Purpose**: Fetch OS details with instruments for dialog
- **Response**: OS object with instrumentos array
- **Authentication**: Required

### Request/Response Examples

#### GET /api/ordens-servico/minhas/
Response:
```json
{
  "results": [
    {
      "id": 1,
      "numero": "0015A26-OS-CAL-001",
      "proposta_numero": "0015A26",
      "cliente_nome": "Empresa ABC",
      "responsavel": 5,
      "data_expiracao": "2024-12-31",
      "tipo_os": "CAL",
      "status": "AR",
      "instrumentos_count": 3
    }
  ]
}
```

## Component Responsibilities

### Main Components

#### `MinhasOSPage` (Main Container)
- **Responsibilities**:
  - Fetch user's OS using `useMyOrdensServico` hook
  - Manage dialog state using `useOSDetailsDialog` hook
  - Render page layout (summary + table)
  - Handle loading, empty, and error states

#### `OSSummaryRow` (Shared Component)
- **Responsibilities**:
  - Display OS status distribution in horizontal row layout
  - Calculate counts from provided OS array
  - Show loading state while calculating
  - Same component used in Equipe page

#### `OSTable` (Shared Component)
- **Responsibilities**:
  - Display OS table with columns: OS, Cliente, Expiração, Tipo, Status
  - Handle pagination
  - Handle row click to open dialog
  - Show loading, empty, and error states
  - Same component used in Equipe page

#### `OrdemServicoRow` (Shared Component)
- **Responsibilities**:
  - Render single OS row
  - Display all columns with proper formatting
  - Handle row click event
  - Same component used in Equipe page

#### `OrdemServicoDetailsDialog` (Shared Component)
- **Responsibilities**:
  - Display OS details
  - Show associated instruments
  - Handle close action
  - Loading/empty/error states
  - Same component used in Equipe page

### Shared Hooks

#### `useOSDetailsDialog`
- **Purpose**: Manage dialog state (open/close, selected OS)
- **Returns**: `{ selectedOS, isOpen, openDialog, closeDialog }`
- **Used by**: Both EquipePage and MinhasOSPage

## Migration From V1

### Breaking Changes

1. **UI Layout Change**
   - V1: Expandable rows with inline instrument display
   - V2: Table with row click opening dialog (consistent with Equipe page)

2. **Component Reuse**
   - V1: Custom components specific to MinhasOSPage
   - V2: Shared components with Equipe page

3. **Column Order**
   - V1: Número, Proposta, Cliente, Instrumentos, Data de Expiração
   - V2: OS, Cliente, Expiração, Tipo, Status (matches Equipe page)

4. **Summary Card**
   - V1: No summary card
   - V2: Summary card with status distribution (same as Equipe page)

### Migration Steps

1. **Extract Shared Components**
   - Create `OSTable` component from EquipePage
   - Create `useOSDetailsDialog` hook for dialog management
   - Reuse `OSSummaryRow` component

2. **Update MinhasOSPage**
   - Replace custom table with `OSTable`
   - Add `OSSummaryRow` above table
   - Use `useOSDetailsDialog` for dialog management
   - Remove expandable row logic

3. **Update EquipePage**
   - Refactor to use `OSTable` component
   - Use `useOSDetailsDialog` hook
   - Remove duplicate table code

## Edge Cases & Failures

### Empty State
- **Scenario**: User has no OS assigned
- **Behavior**: Show empty state with message: "Você ainda não possui ordens de serviço atribuídas"

### Permission Denied
- **Scenario**: Non-staff user tries to access page
- **Behavior**: Redirect to 404 page

### Network/Integration Failures
- **Scenario**: API fails to load OS
- **Behavior**: Show error message with retry button

### Missing Data
- **Scenario**: OS has no expiration date
- **Behavior**: Display "Sem expiração" in expiration column

- **Scenario**: OS has unexpected status value
- **Behavior**: Display status as-is or map to known status

## Acceptance Criteria

### Layout & Structure
- [ ] Page accessible at `/eu` route
- [ ] OS summary row appears above OS table
- [ ] OS table displays with correct columns: OS, Cliente, Expiração, Tipo, Status
- [ ] Layout matches Equipe page (without employee list card)

### Data & Filtering
- [ ] Only shows OS where responsavel = current user
- [ ] Summary card reflects filtered dataset (user's OS only)
- [ ] Data fetched from `/api/ordens-servico/minhas/`

### Interactions
- [ ] Row click opens details dialog
- [ ] Dialog shows OS details and associated instruments
- [ ] Dialog uses same component as Equipe page
- [ ] Expiration date is display-only (read-only)

### Component Reuse
- [ ] Uses `OSTable` component (shared with Equipe page)
- [ ] Uses `OSSummaryRow` component (shared with Equipe page)
- [ ] Uses `OrdemServicoDetailsDialog` component (shared with Equipe page)
- [ ] Uses `useOSDetailsDialog` hook (shared with Equipe page)

### States
- [ ] Loading state while fetching OS
- [ ] Empty state when no OS found
- [ ] Error state with retry option
- [ ] Dialog loading state while fetching details

### Permissions
- [ ] Page accessible only to staff users
- [ ] Non-staff users redirected to 404

## Open Questions

- [ ] Should there be a way to mark OS as "in progress" or "completed"?
- [ ] Should we add date range filtering?
- [ ] Should we add search/filter capabilities?

## Related Documentation

- [Team List Feature (Equipe Page)](../team-list/plan.v2.md)
- [Backend OS API Documentation](../../backend/os/create-on-approval/plan.v2.md)