# Feature: Unified Service Orders Page with Tabs

> **Status**: Planning  
> **Date**: 2026-03-06  
> **Related**: 
> - [My OS Page](../my-os-page/plan.md) - Current `/eu` implementation
> - [Team List Feature](../team-list/plan.v2.md) - Current `/ordens-servico` implementation
> - Backend: [OS List API](../../../backend/os/list-os/plan.md)

## Feature Summary

Unify the service orders listing experience by consolidating `/admin/eu` and `/admin/ordens-servico` into a single page with tab-based filtering. The unified page will support switching between viewing all service orders and viewing only the logged-in user's service orders through tabs.

## User Value

### Problem Solved
Currently, users must navigate between two separate routes (`/admin/ordens-servico` and `/admin/eu`) to switch between viewing all OSs and their own OSs. This creates navigation friction and requires maintaining duplicate UI components.

### Who Benefits
- **Lab Technicians**: Quick access to both all OSs and their own OSs in one place
- **Managers (Gerentes)**: Unified interface for managing team OSs and personal OSs
- **Staff Members**: Simplified navigation without route switching

## Current State Analysis

### Current Routes

#### `/admin/ordens-servico` (EquipePage)
- **Component**: `EquipePage.jsx`
- **Hook**: `useOrdensServico(null, { fetchAll: true })`
- **API**: `GET /ordens-servico/` with `page_size: 9999`
- **Features**:
  - Shows all service orders
  - Employee list card for filtering by employee
  - Global statistics (all OSs)
  - OS table with all OSs

#### `/admin/eu` (MinhasOSPage)
- **Component**: `MinhasOSPage.jsx`
- **Hook**: `useMyOrdensServico()`
- **API**: `GET /ordens-servico/minhas/`
- **Features**:
  - Shows only logged-in user's service orders
  - User-specific statistics
  - OS table filtered to user's OSs only
  - No employee list card

### Shared Components
Both pages currently use:
- `OSSummaryRow` - Statistics card component
- `OSTable` - OS table component
- `OrdemServicoRow` - Individual OS row component
- `OrdemServicoDetailsDialog` - OS details dialog
- `useOSDetailsDialog` - Dialog state management hook

## Target Architecture

### Unified Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  /admin/ordens-servico (Unified)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  TABS: [Todas] [Minhas]                                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ OS SUMMARY (Horizontal Row)                         │    │
│  │ [Todos: 12] [A realizar: 0] [EA: 3] [Finalizadas: 9]│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [Employee List Card - Only in "Todas" tab]                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ OS TABLE                                             │    │
│  │ OS | Cliente | Expiração | Tipo | Status | ...     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Scope

### In Scope
- Add tabs above statistics section: "Todas" and "Minhas"
- Tab "Todas":
  - Shows all service orders (current `/admin/ordens-servico` behavior)
  - Shows global statistics (all OSs)
  - Shows employee list card for filtering
  - Uses `useOrdensServico(null, { fetchAll: true })`
- Tab "Minhas":
  - Shows only logged-in user's service orders (current `/admin/eu` behavior)
  - Shows user-specific statistics (only user's OSs)
  - Hides employee list card
  - Uses `useMyOrdensServico()`
- State management for active tab
- Query invalidation when switching tabs
- Loading states during tab switches
- Empty states for both tabs
- Remove `/admin/eu` route after migration

### Out of Scope
- Changing backend API structure
- Adding new filtering capabilities
- Modifying statistics calculation logic
- Changing OS table columns or behavior
- Employee list card modifications (except visibility control)

## UX Layout Description

### Tab Component

**Position**: Above statistics section, below page title  
**Layout**: Material-UI `Tabs` component  
**Options**:
- "Todas" (All)
- "Minhas" (Mine)

**Styling**:
- Use Material-UI `Tab` component
- Primary color for active tab
- Clear visual distinction between active/inactive

### Tab: "Todas" (All)

#### Statistics Section
- **Component**: `OSSummaryRow`
- **Data Source**: All OSs from `useOrdensServico(null, { fetchAll: true })`
- **Content**: Global statistics
  - Todos (total count of all OSs)
  - A realizar (count of all OSs with status AR)
  - Em andamento (count of all OSs with status EA)
  - Finalizadas (count of all OSs with status RE)

#### Employee List Card
- **Visibility**: Shown only in "Todas" tab
- **Component**: `EmployeeListCard` (existing)
- **Behavior**: Same as current EquipePage
  - Click employee to filter OSs by that employee
  - Click again to clear filter
  - Shows OS count per employee

#### OS Table
- **Component**: `OSTable`
- **Data Source**: All OSs (or filtered by selected employee)
- **Columns**: OS, Cliente, Expiração, Tipo, Status, Liberada para faturamento
- **Behavior**: Same as current EquipePage

### Tab: "Minhas" (Mine)

#### Statistics Section
- **Component**: `OSSummaryRow`
- **Data Source**: User's OSs from `useMyOrdensServico()`
- **Content**: User-specific statistics
  - Todos (total count of user's OSs)
  - A realizar (count of user's OSs with status AR)
  - Em andamento (count of user's OSs with status EA)
  - Finalizadas (count of user's OSs with status RE)

#### Employee List Card
- **Visibility**: Hidden in "Minhas" tab
- **Rationale**: Not relevant when viewing only user's OSs

#### OS Table
- **Component**: `OSTable`
- **Data Source**: Only logged-in user's OSs
- **Columns**: OS, Cliente, Expiração, Tipo, Status, Liberada para faturamento
- **Behavior**: Same as current MinhasOSPage
- **Empty State**: "Você ainda não possui ordens de serviço atribuídas"

## Interaction Rules

### Tab Switching

#### Initial Load
- Default tab: "Todas" (preserves current behavior)
- Load data for "Todas" tab on page mount
- Show loading state while fetching

#### Tab Change
1. User clicks "Minhas" tab
2. Show loading state
3. Fetch user's OSs using `useMyOrdensServico()`
4. Update statistics to reflect user's OSs only
5. Update OS table to show only user's OSs
6. Hide employee list card

#### Tab Change (Reverse)
1. User clicks "Todas" tab
2. Show loading state (if data not cached)
3. Fetch all OSs using `useOrdensServico(null, { fetchAll: true })`
4. Update statistics to reflect all OSs
5. Update OS table to show all OSs
6. Show employee list card

### State Management

#### Active Tab State
```javascript
const [activeTab, setActiveTab] = useState('todas'); // 'todas' | 'minhas'
```

#### Query Management
- Use React Query's `enabled` option to control when queries run
- "Todas" query: enabled when `activeTab === 'todas'`
- "Minhas" query: enabled when `activeTab === 'minhas'`
- Both queries can be cached independently

#### Loading States
- Show loading skeleton/spinner when:
  - Initial page load
  - Switching tabs (if data not cached)
  - Refetching after mutations

### Employee Filtering (Todas Tab Only)

- Employee selection behavior remains the same as current EquipePage
- Filtering happens client-side on the "Todas" dataset
- Statistics update to reflect filtered dataset
- Clear filter when switching to "Minhas" tab

## Data Flow

### Initial Load (Todas Tab)
1. Page loads with "Todas" tab active
2. Fetch all OSs: `GET /ordens-servico/` with `page_size: 9999`
3. Fetch staff users for employee list
4. Calculate global statistics
5. Render statistics card
6. Render employee list card
7. Render OS table with all OSs

### Switch to Minhas Tab
1. User clicks "Minhas" tab
2. Set `activeTab = 'minhas'`
3. Enable "Minhas" query (if not cached)
4. Fetch user's OSs: `GET /ordens-servico/minhas/`
5. Calculate user-specific statistics
6. Update statistics card
7. Hide employee list card
8. Update OS table with user's OSs only

### Switch to Todas Tab
1. User clicks "Todas" tab
2. Set `activeTab = 'todas'`
3. Enable "Todas" query (if not cached)
4. Fetch all OSs (if needed)
5. Calculate global statistics
6. Update statistics card
7. Show employee list card
8. Update OS table with all OSs

### OS Details Dialog
- Behavior remains the same for both tabs
- Clicking OS row opens `OrdemServicoDetailsDialog`
- Dialog fetches full OS details with instruments
- Works identically regardless of active tab

## Component Responsibilities

### Modified Components

#### `EquipePage.jsx` (Renamed/Refactored)
- **New Name**: `UnifiedOSPage.jsx` (or keep `EquipePage.jsx`)
- **Responsibilities**:
  - Manage active tab state
  - Conditionally render employee list card (only in "Todas" tab)
  - Conditionally fetch data based on active tab
  - Render tabs component
  - Pass appropriate data to `OSSummaryRow` and `OSTable`
  - Handle tab switching logic

**New State**:
```javascript
const [activeTab, setActiveTab] = useState('todas');
```

**New Hooks**:
```javascript
// Conditional queries based on active tab
const { ordensServico: todasOS, ... } = useOrdensServico(
  null,
  { fetchAll: true, enabled: activeTab === 'todas' }
);

const { ordensServico: minhasOS, ... } = useMyOrdensServico({
  enabled: activeTab === 'minhas'
});
```

### Unchanged Components

#### `OSSummaryRow`
- No changes needed
- Receives OS array and calculates statistics
- Works with both "Todas" and "Minhas" datasets

#### `OSTable`
- No changes needed
- Receives OS array and renders table
- Works with both "Todas" and "Minhas" datasets

#### `EmployeeListCard`
- No changes needed
- Visibility controlled by parent component
- Only shown in "Todas" tab

#### `OrdemServicoDetailsDialog`
- No changes needed
- Works identically for both tabs

## API Integration

### Backend Endpoints (No Changes Required)

#### Get All OSs
- **Endpoint**: `GET /ordens-servico/`
- **Query Params**: `page_size=9999` (for fetchAll)
- **Used By**: "Todas" tab
- **Response**: Paginated list of all OSs

#### Get My OSs
- **Endpoint**: `GET /ordens-servico/minhas/`
- **Query Params**: Optional `limit`
- **Used By**: "Minhas" tab
- **Response**: Array of OSs where `responsavel = current_user`

### React Query Configuration

#### Query Keys
- "Todas": `['ordens-servico', null, true]` (from `useOrdensServico`)
- "Minhas": `['ordens-servico', 'minhas']` (from `useMyOrdensServico`)

#### Query Invalidation
- After mutations (create, update, move instruments):
  - Invalidate both query keys to ensure fresh data
  - Or invalidate based on active tab only (optimization)

## Migration Strategy

### Phase 1: Implementation
1. **Add tabs to EquipePage**
   - Add Material-UI `Tabs` component
   - Add state management for active tab
   - Conditionally render employee list card

2. **Add conditional data fetching**
   - Add `useMyOrdensServico` hook to EquipePage
   - Use `enabled` option to control query execution
   - Update statistics and table based on active tab

3. **Update statistics calculation**
   - Pass appropriate OS array to `OSSummaryRow` based on active tab
   - Ensure statistics reflect correct dataset

4. **Test both tabs**
   - Verify "Todas" tab matches current `/admin/ordens-servico` behavior
   - Verify "Minhas" tab matches current `/admin/eu` behavior

### Phase 2: Route Cleanup
1. **Update navigation/routing**
   - Remove `/admin/eu` route from `MainRouter.jsx`
   - Add redirect from `/admin/eu` to `/admin/ordens-servico` (optional, for backward compatibility)
   - Update any navigation links that point to `/admin/eu`

2. **Remove MinhasOSPage component**
   - Delete `MinhasOSPage.jsx` file
   - Remove import from `MainRouter.jsx`
   - Clean up unused code

3. **Update documentation**
   - Mark `/admin/eu` as deprecated
   - Update user guides if any

### Phase 3: Verification
1. **Functional testing**
   - Test tab switching
   - Test statistics accuracy for both tabs
   - Test employee filtering in "Todas" tab
   - Test OS details dialog from both tabs
   - Test empty states

2. **Performance testing**
   - Verify query caching works correctly
   - Ensure no unnecessary refetches when switching tabs
   - Check loading states are appropriate

## Edge Cases & Error Handling

### Empty States

#### Todas Tab - No OSs
- **Scenario**: No service orders exist in system
- **Behavior**: Show empty state message in OS table
- **Message**: "Nenhuma ordem de serviço encontrada"

#### Minhas Tab - No OSs
- **Scenario**: User has no assigned OSs
- **Behavior**: Show empty state message in OS table
- **Message**: "Você ainda não possui ordens de serviço atribuídas"

### Loading States

#### Initial Load
- Show loading skeleton for statistics and table
- Disable tab switching during initial load

#### Tab Switch
- Show loading indicator in statistics card
- Show loading skeleton in table
- Optionally: show cached data with loading overlay

### Error States

#### API Failure - Todas Tab
- Show error message in statistics card
- Show error message in table
- Provide retry button

#### API Failure - Minhas Tab
- Show error message in statistics card
- Show error message in table
- Provide retry button

### Permission Issues

#### Non-Staff User
- Redirect to 404 (existing behavior)
- Applies to both tabs

#### Non-Manager Accessing Todas Tab
- Current EquipePage requires manager permission
- Maintain same permission check for "Todas" tab
- "Minhas" tab should be accessible to all staff (current `/eu` behavior)

## Acceptance Criteria

### Tab Functionality
- [ ] Tabs appear above statistics section
- [ ] "Todas" tab is selected by default
- [ ] User can switch between "Todas" and "Minhas" tabs
- [ ] Active tab is visually distinct
- [ ] Tab switching updates statistics and table correctly

### Todas Tab
- [ ] Shows all service orders (matches current `/admin/ordens-servico`)
- [ ] Shows global statistics (all OSs)
- [ ] Shows employee list card
- [ ] Employee filtering works correctly
- [ ] Statistics update when employee is selected/deselected

### Minhas Tab
- [ ] Shows only logged-in user's service orders (matches current `/admin/eu`)
- [ ] Shows user-specific statistics (only user's OSs)
- [ ] Hides employee list card
- [ ] Empty state shows correct message when user has no OSs

### Data Management
- [ ] Queries are cached independently for each tab
- [ ] Switching tabs uses cached data when available
- [ ] Loading states are shown appropriately
- [ ] Query invalidation works correctly after mutations

### Route Migration
- [ ] `/admin/eu` route is removed from router
- [ ] `/admin/ordens-servico` works with tabs
- [ ] Old `/admin/eu` links redirect or are updated
- [ ] MinhasOSPage component is removed

### Component Reuse
- [ ] Uses existing `OSSummaryRow` component
- [ ] Uses existing `OSTable` component
- [ ] Uses existing `EmployeeListCard` component
- [ ] Uses existing `OrdemServicoDetailsDialog` component
- [ ] No duplicate code between tabs

## Technical Implementation Notes

### Tab Component Pattern

Use Material-UI `Tabs`:

```javascript
import { Tabs, Tab, Box } from '@mui/material';

<Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
  <Tab label="Todas" value="todas" />
  <Tab label="Minhas" value="minhas" />
</Tabs>
```

### Conditional Rendering Pattern

```javascript
{activeTab === 'todas' && (
  <Grid item xs={12} md={4}>
    <EmployeeListCard ... />
  </Grid>
)}
```

### Query Management Pattern

```javascript
const { ordensServico: todasOS, isLoading: isLoadingTodas } = useOrdensServico(
  null,
  { 
    fetchAll: true,
    enabled: activeTab === 'todas'
  }
);

const { ordensServico: minhasOS, isLoading: isLoadingMinhas } = useMyOrdensServico({
  enabled: activeTab === 'minhas'
});

// Use appropriate data based on active tab
const currentOS = activeTab === 'todas' ? todasOS : minhasOS;
const isLoading = activeTab === 'todas' ? isLoadingTodas : isLoadingMinhas;
```

## Open Questions

1. **Default Tab**: Should "Todas" or "Minhas" be the default? (Proposed: "Todas" to match current behavior)
2. **Tab Persistence**: Should the active tab be persisted in URL or localStorage? (Proposed: URL query param for bookmarking)
3. **Employee Filtering**: When switching from "Todas" (with employee selected) to "Minhas" and back, should employee filter be cleared? (Proposed: Yes, clear filter)
4. **Permission Model**: Should "Minhas" tab be accessible to all staff, or only managers? (Proposed: All staff, matching current `/eu` behavior)
5. **Statistics Caching**: Should statistics be recalculated on every tab switch, or cached? (Proposed: Recalculate from cached OS data)

## Related Documentation

- [My OS Page (Current /eu)](../my-os-page/plan.md)
- [Team List Feature (Current /ordens-servico)](../team-list/plan.v2.md)
- [Backend OS List API](../../../backend/os/list-os/plan.md)
