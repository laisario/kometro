# Feature: Ordens de Serviço - Team List (V2)

> **Version**: 2.0  
> **Status**: Planning - Migrating to Unified OS Page  
> **Supersedes**: [plan.md](./plan.md) (V1)  
> **Date**: 2025-01-XX  
> **Migration Target**: [Unified OS Page with Tabs](../unified-os-page-with-tabs/plan.md)

## ⚠️ Architecture Update Notice

**This feature is being enhanced to support a unified service orders page with tabs.**

The `/admin/ordens-servico` route will be updated to include tabs for switching between "Todas" (all OSs) and "Minhas" (user's OSs), consolidating the functionality currently split between `/admin/ordens-servico` and `/admin/eu`.

**Migration Plan**: See [Unified OS Page with Tabs](../unified-os-page-with-tabs/plan.md) for the new architecture.

## Feature Overview

V2 of the Team List feature simplifies the workflow for managers to view and manage Ordens de Serviço (OS) by making the employee list the primary filter controller. The layout is restructured to prioritize employee selection, with OS filtering happening dynamically based on employee selection. The "Atribuir" tab is removed, and inline editing capabilities are enhanced.

**Key Changes from V1:**
- Employee list becomes the main filter controller (left side)
- OS table moves to right side
- "Atribuir" tab completely removed
- Employee selection controls OS filtering (toggle behavior: click to filter, click again to clear)
- New OS summary card showing status distribution (above OS table, horizontal layout)
- Team member detailed page removed
- Simplified interaction model
- Expiration date editing removed from table (display-only)

## User Value

### Problem Solved
Managers need a streamlined way to:
- Quickly see which employees have OS assigned
- Filter OS by employee with simple toggle interactions
- View OS status distribution per employee
- Assign responsibilities inline
- View expiration dates (read-only)
- Access detailed OS information without navigation complexity

### Who Benefits
- **Gerente (Manager)**: Simplified workflow for managing OS assignments, viewing employee workload, and tracking responsibilities

## Personas

### Primary Persona: Gerente (Manager)
- **Role**: Oversees all OS and team assignments
- **Goals**: 
  - Quickly identify which employees have pending OS
  - Filter OS by employee to review workload
  - Assign responsibilities efficiently
  - Track OS status distribution
- **Pain Points (V1)**:
  - Tab switching between "Equipe" and "Atribuir" is cumbersome
  - No quick way to see employee OS counts
  - Navigation to detailed pages breaks workflow
  - OS filtering requires multiple steps

## Scope

### In Scope
- Employee list as primary filter controller (left side)
- OS table filtered by selected employee (right side)
- Employee row shows OS count with status="a_realizar"
- Toggle behavior: Click employee to filter, click same employee again to clear filter
- OS summary card showing status distribution (above OS table, horizontal layout)
- Inline assignment/update of responsável in OS table
- Expiration date displayed in table (read-only, no editing)
- Click OS row to open dialog with detailed information
- Display associated instruments in details dialog
- Loading, empty, and error states
- Visual feedback for employee selection state
- Username fallback when employee name is missing

### Out of Scope
- Create/edit OS manually (OS are created automatically on proposal approval)
- Delete OS
- Search/filter OS by text (future enhancement)
- Pagination for OS table (future enhancement)
- Bulk operations on OS
- Create/edit staff users
- Team member detailed page (removed in V2)
- "Atribuir" tab (removed in V2)

## UX Layout Description

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  /admin/equipe                                              │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  EMPLOYEES LIST  │  OS SUMMARY (Horizontal Row)            │
│  (Left Card)     │  [Todos: 12] [A realizar: 0] [EA: 3]   │
│                  │  [Finalizadas: 9]                       │
│  ┌────────────┐  │                                          │
│  │ Maria      │  │  OS TABLE                                │
│  │ Silva      │  │  ┌──────────────────────────────────┐  │
│  │ 5 OS       │  │  │ OS | Cliente | Expiração | Tipo  │  │
│  └────────────┘  │  │    |        |           | Status │  │
│                  │  ├──────────────────────────────────────┤  │
│  ┌────────────┐  │  │ OS-001 | ABC | 31/12 | CAL | AR │  │
│  │ João       │  │  │ OS-002 | XYZ | 15/01 | BAL | EA │  │
│  │ Pedro      │  │  │ ...                             │  │
│  │ 2 OS       │  │  └──────────────────────────────────┘  │
│  └────────────┘  │                                          │
│                  │                                          │
│  ┌────────────┐  │                                          │
│  │ Ana        │  │                                          │
│  │ Costa      │  │                                          │
│  │ 0 OS       │  │                                          │
│  └────────────┘  │                                          │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### Layout Details

#### Left Side: Employee List Card
- **Position**: First card, left side
- **Width**: Responsive (full width on mobile, ~30-40% on desktop)
- **Content**: 
  - Card header: "Equipe" or "Membros da Equipe"
  - List of employees with:
    - Left: Employee name (or username if name is missing)
    - Right: OS count (status="a_realizar")
  - Visual indication of selected employee (highlight/background color)
  - Clickable rows (toggle behavior: click to select/filter, click again to deselect)

#### Right Side: OS Summary and Table
- **Position**: Right side (or below on mobile)
- **Width**: Responsive (full width on mobile, ~60-70% on desktop)

##### OS Summary Row
- **Position**: Above OS table, horizontal layout
- **Content**: 
  - Horizontal row of status counts: [Todos: X] [A realizar: Y] [Em andamento: Z] [Finalizadas: W]
  - Updates dynamically based on employee selection
  - If no employee selected: shows global counts with "Todos" label
  - If employee selected: shows filtered counts for that employee

##### OS Table Card
- **Position**: Below OS summary row
- **Content**:
  - Table with columns: OS, Cliente, Expiração, Tipo, Status
  - Expiração column is display-only (read-only, no editing)
  - Inline editing for responsável only
  - Pagination controls
  - Filtered by selected employee (if any)

## Interaction Rules

### Employee Selection (Toggle Behavior)

#### Default State
- **No employee selected**: Show ALL OS in table
- **OS summary**: Shows global counts with "Todos" label

#### Click on Employee (First Click)
- **Action**: Select employee (if not already selected)
- **Behavior**:
  - Employee row becomes visually selected (highlight/background change)
  - OS table filters to show ONLY OS where `responsavel = selected_employee_id`
  - OS summary row updates to show status distribution for selected employee
  - Previous selection is cleared if another employee is clicked

#### Click on Same Employee (Second Click)
- **Action**: Deselect employee (toggle off)
- **Behavior**:
  - Employee selection is cleared (no row highlighted)
  - OS table returns to default: show ALL OS (no filter)
  - OS summary row updates to show global status distribution with "Todos" label

**Important**: This is a toggle behavior. There is NO double-click interaction. Clicking the same employee twice (with any time interval) will toggle selection on/off.

### OS Table Interactions

#### Row Click
- Opens details dialog with OS information and associated instruments
- Same behavior as V1

#### Inline Editing
- **Responsável**: Dropdown/select in table cell (same as V1)
- **Data de Expiração**: Display-only (read-only, no editing in table)
- Updates trigger API call and UI refresh
- Visual feedback (loading indicator) per row during update

### UI Rules

#### Username Fallback
- **Rule**: If employee name (firstName + lastName) is null, empty, or undefined
- **Behavior**: Display `employee.username` instead
- **Fallback**: If username is also missing, display "Sem nome" or similar placeholder
- **Applies to**: Employee list display, OS summary labels, any employee name reference

### State Management

#### Selected Employee State
```javascript
const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
```

#### Toggle Selection Logic
```javascript
const handleEmployeeClick = (employeeId) => {
  if (selectedEmployeeId === employeeId) {
    // Toggle off: clear selection
    setSelectedEmployeeId(null);
  } else {
    // Toggle on: select employee
    setSelectedEmployeeId(employeeId);
  }
};
```

#### Filter Logic
```javascript
const filteredOS = useMemo(() => {
  if (!ordensServico) return [];
  
  if (selectedEmployeeId) {
    return ordensServico.filter(os => os.responsavel === selectedEmployeeId);
  }
  
  return ordensServico; // Show all if no selection
}, [ordensServico, selectedEmployeeId]);
```

#### OS Count Calculation
```javascript
const getOSCountForEmployee = (employeeId) => {
  return ordensServico.filter(
    os => os.responsavel === employeeId && os.status === 'AR'
  ).length;
};
```

#### Username Fallback Logic
```javascript
const getEmployeeDisplayName = (employee) => {
  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  return fullName || employee.username || 'Sem nome';
};
```

## Data Flow

### Initial Load
1. Page loads → Fetch staff users (`GET /api/users/?is_staff=true`)
2. Page loads → Fetch all OS (`GET /api/ordens-servico/`)
3. Calculate OS counts per employee (status="a_realizar")
4. Render employee list with counts
5. Render OS table (all OS, no filter)
6. Render OS summary (global counts)

### Employee Selection Flow
1. User clicks employee row
2. If employee not selected: `selectedEmployeeId` state updated to employee ID
3. If employee already selected: `selectedEmployeeId` state cleared (toggle off)
4. OS table re-renders with filtered data (or all OS if deselected)
5. OS summary row updates to show status distribution (filtered or global)
6. Visual feedback: employee row highlighted (or cleared if deselected)

### Employee Deselection Flow
1. User clicks the same employee row that is currently selected (toggle off)
2. `selectedEmployeeId` state cleared (set to null)
3. OS table re-renders showing all OS
4. OS summary row updates to show global distribution with "Todos" label
5. Visual feedback: no employee row highlighted

### OS Update Flow
1. User updates responsável inline (expiração is read-only)
2. API call: `PATCH /api/ordens-servico/:id/`
3. On success: Refresh OS list, update employee counts
4. On error: Rollback, show error message

## API Dependencies

### Backend Endpoints

#### List Staff Users
- **Endpoint**: `GET /api/users/?is_staff=true`
- **Purpose**: Fetch all staff members for employee list
- **Response**: Array of user objects with id, firstName, lastName, email

#### List OS
- **Endpoint**: `GET /api/ordens-servico/`
- **Purpose**: Fetch all OS (filtered client-side by selected employee)
- **Query Params**: 
  - `responsavel={id}` (optional, for server-side filtering if preferred)
- **Response**: Array of OS objects

#### Update OS
- **Endpoint**: `PATCH /api/ordens-servico/:id/`
- **Purpose**: Update responsável (expiração editing removed from table)
- **Request Body**: 
  ```json
  {
    "responsavel": 5
  }
  ```

#### Get OS Detail
- **Endpoint**: `GET /api/ordens-servico/:id/`
- **Purpose**: Fetch OS details with instruments for dialog
- **Response**: OS object with instrumentos array

### Request/Response Examples

#### GET /api/users/?is_staff=true
Response:
```json
{
  "results": [
    {
      "id": 5,
      "firstName": "Maria",
      "lastName": "Silva",
      "email": "maria@example.com",
      "username": "maria.silva"
    }
  ]
}
```

#### GET /api/ordens-servico/
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
      "responsavel_nome": "Maria Silva",
      "data_expiracao": "2024-12-31",
      "tipo_os": "CAL",
      "status": "AR",
      "instrumentos_count": 3
    }
  ]
}
```

## Filtering Logic

### Employee-Based Filtering

#### Client-Side Filtering (Recommended)
- Fetch all OS on page load
- Filter in memory based on `selectedEmployeeId`
- Pros: Fast, no additional API calls
- Cons: Requires loading all OS (may need pagination for large datasets)

#### Server-Side Filtering (Alternative)
- Pass `responsavel={id}` query param when employee selected
- Refetch OS list on employee selection
- Pros: Handles large datasets better
- Cons: Additional API calls, loading states

**Recommendation**: Start with client-side filtering. If performance becomes an issue with large datasets, implement server-side filtering.

### OS Count Calculation

Count OS where:
- `responsavel = employee_id`
- `status = "AR"` (a_realizar)

Display format: `{count} OS`

Example:
- Maria Silva: 5 OS
- João Pedro: 2 OS
- Ana Costa: 0 OS

## Component Responsibilities

### Main Components

#### `EquipePage` (Main Container)
- **Responsibilities**:
  - Manage selected employee state
  - Fetch staff users and OS
  - Handle employee click events (toggle behavior)
  - Coordinate filtering logic
  - Render layout (Grid with left/right cards)

#### `EmployeeListCard`
- **Responsibilities**:
  - Display list of employees (minimal: name/username and OS count only)
  - Show OS count per employee (status="a_realizar")
  - Handle toggle click (select/deselect)
  - Username fallback when employee name is missing
  - Visual feedback for selected employee
  - Loading/empty states

#### `OSTableCard`
- **Responsibilities**:
  - Display OS table with columns: OS, Cliente, Expiração, Tipo, Status
  - Filter OS based on selected employee
  - Inline editing for responsável only (expiração is read-only)
  - Handle row click to open details dialog
  - Pagination
  - Loading/empty/error states

#### `OSSummaryRow`
- **Responsibilities**:
  - Display OS status distribution in horizontal row layout
  - Position above OS table
  - Update based on selected employee (or show global if none selected)
  - Calculate counts: Todos, A realizar, Em andamento, Finalizadas
  - Show "Todos" label when no employee selected
  - Loading state while calculating

#### `OrdemServicoRow`
- **Responsibilities**:
  - Render single OS row
  - Inline editing controls (responsável dropdown only)
  - Display expiração as read-only text
  - Handle update API calls
  - Visual feedback during updates

#### `OrdemServicoDetailsDialog`
- **Responsibilities**:
  - Display OS details
  - Show associated instruments
  - Handle close action
  - Loading/empty/error states

### Removed Components

#### `EquipeSidebar` (Modified)
- **V1**: Had tabs "Equipe" and "Atribuir"
- **V2**: Replaced by `EmployeeListCard` (no tabs, no "Atribuir" tab)

#### `AtribuirTab` (Removed)
- **V1**: Tab for assigning responsável and expiração
- **V2**: Functionality moved to inline editing in OS table

## Migration From V1

### Breaking Changes

1. **Layout Change**
   - V1: OS table on left, sidebar with tabs on right
   - V2: Employee list on left, OS table on right

2. **"Atribuir" Tab Removed**
   - V1: Tab-based assignment workflow
   - V2: Inline editing in OS table only

3. **Team Member Detailed Page Removed**
   - V1: Route `/admin/equipe/:userId` existed
   - V2: Route removed, navigation to this page should redirect to `/admin/equipe`

4. **Employee List Behavior**
   - V1: Click navigated to team member page
   - V2: Click filters OS table, click again on same employee clears filter (toggle behavior)

### Migration Steps

1. **Update Route Configuration**
   - Remove route: `/admin/equipe/:userId`
   - Keep route: `/admin/equipe`

2. **Refactor EquipePage**
   - Remove tab logic
   - Implement employee selection state with toggle behavior
   - Add click handlers (toggle on/off)
   - Restructure layout (Grid with left/right cards)
   - Position OS summary row above OS table

3. **Create EmployeeListCard Component**
   - Extract employee list from EquipeSidebar
   - Add OS count display
   - Add selection state handling
   - Remove navigation to detail page

4. **Update OSTableCard**
   - Ensure inline editing works for responsável only
   - Remove expiração editing (make read-only)
   - Add filtering logic based on selected employee
   - Update column order: OS, Cliente, Expiração, Tipo, Status

5. **Create OSSummaryRow Component**
   - New component for status distribution (horizontal row layout)
   - Position above OS table
   - Calculate counts from filtered OS
   - Update based on employee selection
   - Show "Todos" label when no employee selected

6. **Remove EquipeMemberPage**
   - Delete component file
   - Remove route registration
   - Update any navigation links

7. **Update Navigation**
   - Remove links to `/admin/equipe/:userId`
   - Update any breadcrumbs or references

## Removed Features

### Team Member Detailed Page
- **Route**: `/admin/equipe/:userId`
- **Component**: `EquipeMemberPage`
- **Reason**: Workflow simplified - filtering replaces navigation
- **Migration**: Users should use employee selection on main page instead

### "Atribuir" Tab
- **Component**: `AtribuirTab` within `EquipeSidebar`
- **Reason**: Inline editing in OS table is more efficient
- **Migration**: Assignment functionality available directly in OS table rows

## Edge Cases & Failures

### Employee Selection Edge Cases

#### No Employees
- **Scenario**: No staff users found
- **Behavior**: Show empty state in employee list card
- **OS Table**: Show all OS (no filter possible)

#### Employee with No OS
- **Scenario**: Employee selected but has no OS assigned
- **Behavior**: 
  - OS table shows empty state
  - OS summary shows all zeros
  - Clear indication: "Nenhuma OS atribuída a [Employee Name]"

#### Click on Different Employee
- **Scenario**: User clicks employee B while employee A is selected
- **Behavior**: Employee A is deselected, employee B is selected (toggle behavior)

#### OS Count Calculation
- **Scenario**: OS status changes while page is open
- **Behavior**: 
  - Counts may be stale until refresh
  - Consider real-time updates or periodic refresh

### OS Table Edge Cases

#### No OS When Employee Selected
- **Scenario**: Selected employee has no OS
- **Behavior**: Show empty state with message: "Nenhuma OS atribuída a [Employee Name]"

#### OS Without Responsável
- **Scenario**: OS exists but responsável is null
- **Behavior**: 
  - Display "Não atribuído" in responsável column
  - Allow assignment via dropdown
  - Count in "0 OS" for employees without assignments

#### Employee Name Missing
- **Scenario**: Employee has null, empty, or undefined name
- **Behavior**: 
  - Display employee.username as fallback
  - If username also missing, display "Sem nome" or similar placeholder

#### Filtered OS Empty
- **Scenario**: Employee selected but filtered OS list is empty
- **Behavior**: Show empty state, not error state

### OS Summary Row Edge Cases

#### No Employee Selected
- **Scenario**: No employee selected
- **Behavior**: Show global OS summary with "Todos" label in horizontal row

#### Employee Selected But No OS
- **Scenario**: Employee selected but has no OS
- **Behavior**: Show summary with all zeros

#### Status Values Not Available
- **Scenario**: OS has unexpected status value
- **Behavior**: 
  - Map to known statuses or show in "Other" category
  - Log warning for monitoring

### Network/Integration Failures

#### API Failure Loading Employees
- **Behavior**: Show error state in employee list card
- **Recovery**: Retry button, page reload option

#### API Failure Loading OS
- **Behavior**: Show error state in OS table
- **Recovery**: Retry button, page reload option

#### API Failure Updating OS
- **Behavior**: 
  - Rollback visual state
  - Show error toast/notification
  - Allow retry

#### Partial Data Load
- **Scenario**: Employees load but OS fails (or vice versa)
- **Behavior**: 
  - Show available data
  - Show error state for failed component
  - Allow independent retry

## Acceptance Criteria

### Layout & Structure
- [ ] Employee list card appears on left side (first card)
- [ ] OS summary row appears above OS table in horizontal layout
- [ ] OS table card appears on right side (below summary row)
- [ ] "Atribuir" tab is completely removed
- [ ] Layout is responsive (stacks on mobile)

### Employee List
- [ ] Each employee row shows name (or username fallback) on left, OS count on right
- [ ] Employee list is minimal (name/username and OS count only, no static info)
- [ ] OS count shows number of OS with status="a_realizar" for that employee
- [ ] Employee rows are clickable
- [ ] Selected employee is visually highlighted
- [ ] Username fallback when employee name is null, empty, or undefined
- [ ] Loading state while fetching employees
- [ ] Empty state when no employees found

### Employee Selection
- [ ] Click on employee selects it and filters OS table (toggle on)
- [ ] Click on same selected employee clears selection and shows all OS (toggle off)
- [ ] Only one employee can be selected at a time
- [ ] OS table updates immediately when employee is selected/deselected
- [ ] No double-click interaction (toggle behavior only)

### OS Table
- [ ] Table columns in order: OS, Cliente, Expiração, Tipo, Status
- [ ] Table shows all OS when no employee selected
- [ ] Table shows only OS for selected employee when employee is selected
- [ ] Inline editing for responsável (dropdown)
- [ ] Expiração column is display-only (read-only, no editing)
- [ ] Row click opens details dialog
- [ ] Pagination works correctly
- [ ] Loading state while fetching OS
- [ ] Empty state when no OS found (filtered or global)
- [ ] Error state with retry option

### OS Summary Row
- [ ] Appears above OS table in horizontal row layout
- [ ] Shows status distribution: [Todos: X] [A realizar: Y] [Em andamento: Z] [Finalizadas: W]
- [ ] Updates when employee is selected (shows counts for that employee)
- [ ] Shows global counts with "Todos" label when no employee selected
- [ ] Loading state while calculating
- [ ] Handles edge cases (no OS, unexpected statuses)

### Removed Features
- [ ] Route `/admin/equipe/:userId` is removed or redirects to `/admin/equipe`
- [ ] No navigation links to team member detail page
- [ ] EquipeMemberPage component is removed or deprecated
- [ ] "Atribuir" tab is completely removed from UI

### Permissions
- [ ] Page accessible only to users with "gerente" group
- [ ] Non-managers redirected to 404
- [ ] Update operations require gerente permission

### Data & API
- [ ] Employee list fetched from `/api/users/?is_staff=true`
- [ ] OS list fetched from `/api/ordens-servico/`
- [ ] OS updates use `PATCH /api/ordens-servico/:id/`
- [ ] OS details fetched from `GET /api/ordens-servico/:id/` for dialog
- [ ] All API calls handle errors gracefully

### User Experience
- [ ] Visual feedback for employee selection (highlight)
- [ ] Visual feedback during OS updates (loading indicator per row)
- [ ] Success feedback when update succeeds (toast/notification)
- [ ] Error feedback when update fails (toast/notification with retry)
- [ ] Smooth transitions when filtering OS
- [ ] No layout shift during data loading

## Open Questions

- [ ] Should OS count include all statuses or only "a_realizar"? (Answer: Only "a_realizar" per requirements)
- [ ] Should we implement server-side filtering for large OS datasets?
- [ ] Should OS summary row be collapsible/expandable?
- [ ] Should we add keyboard shortcuts (e.g., Escape to clear selection)?
- [ ] Should employee list be searchable/filterable?
- [ ] Should we show OS count for all statuses in employee row, or just "a_realizar"?
- [ ] Should expired OS be highlighted differently in the table?
- [ ] Should we add bulk assignment capabilities in future iteration?

## Related Documentation

- [Backend OS API Documentation](../../backend/os/create-on-approval/plan.v2.md)
- [Frontend Component Patterns](../../../patterns/components.md)
- [State Management Guidelines](../../../patterns/state-management.md)
