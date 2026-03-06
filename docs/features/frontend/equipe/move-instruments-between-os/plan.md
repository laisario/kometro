# Feature: Move Instruments to New OS

> **Status**: Planning  
> **Date**: 2026-03-06  
> **Related**: 
> - Backend: [Reassign Instruments Plan](../../../backend/os/reassign-instruments/plan.md)
> - Component: `OrdemServicoDetailsDialog.jsx`

## Feature Summary

Add bulk selection and movement capabilities to the OS details dialog's instrument table. Users can select one or more instruments and move them to a newly created OS within the same proposal. The user must choose the type of the new OS during creation.

## User Value

### Problem Solved
Operational teams need to correct grouping mistakes or reorganize instruments between OSs after creation. Currently, there's no UI support for this operation, requiring manual database changes or backend-only operations.

### Who Benefits
- **Lab Technicians**: Reorganize instruments when operational needs change
- **Managers (Gerentes)**: Correct grouping errors and optimize OS distribution
- **Operations Team**: Adjust instrument assignments without technical intervention

## Scope

### In Scope
- Add checkbox column to instrument table in OS details dialog
- Support single and multi-select of instruments
- Display bulk action toolbar when instruments are selected
- "Create new OS" action with type selection dialog
- User chooses OS type (CAL, BAL, MAN, EXT) in creation dialog
- Handle success/error states and UI updates
- Clear selection after successful operation
- Maintain backward compatibility with existing table structure

### Out of Scope
- Moving instruments to existing OSs
- Moving instruments across different proposals/clients
- Undo/redo functionality
- Bulk operations on multiple OSs simultaneously
- History/audit trail UI (backend handles this)

## Context

### Current State
The `OrdemServicoDetailsDialog` component displays a read-only table of instruments associated with an OS. The table shows instrument details based on OS type (Calibração, Balanças, Manutenção, Serviços Externos) but has no selection or bulk operation capabilities.

### Component Location
- **File**: `frontend/src/equipe/components/OrdemServicoDetailsDialog.jsx`
- **Table Structure**: Uses Material-UI `Table` component with dynamic columns based on `OS_LAYOUTS` configuration
- **Data Source**: `osDetails.instrumentosOs` array from `useOrdemServico` hook
- **State Management**: React hooks (`useState`, `useEffect`) with React Query for data fetching

### Existing Patterns
The project already has checkbox selection patterns in:
- `InstrumentoTable.jsx` - Uses checkboxes with `selected` state array
- `ClientsPage.jsx` - Uses `TableHeader` component with checkbox support
- `TableHeader.jsx` - Reusable header component with "select all" checkbox

## UX Layout Description

### Table Structure with Selection

```
┌─────────────────────────────────────────────────────────────┐
│  OS Details Dialog                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Header Information]                                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ BULK ACTIONS TOOLBAR (shown when selection exists) │    │
│  │ [X selected] [Gerar nova OS]                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [☑] Item | Descrição | Tag | ...                    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [☐] 1    | Termômetro | TAG-001 | ...              │    │
│  │ [☑] 2    | Balança    | TAG-002 | ...              │    │
│  │ [☑] 3    | Manômetro  | TAG-003 | ...              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [Footer Information]                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Bulk Actions Toolbar

**Position**: Above the table, below header section  
**Visibility**: Only shown when `selectedInstrumentIds.length > 0`  
**Content**:
- Selection count badge: `{selectedCount} selecionado(s)`
- "Gerar nova OS" button (primary)
- Optional: "Limpar seleção" button (text/icon)

**Styling**: 
- Use Material-UI `Box` with flex layout
- Background color: `paper` or `grey.50`
- Padding: `1.5rem` horizontal, `1rem` vertical
- Border bottom: subtle divider

### Checkbox Column

**Position**: First column (leftmost)  
**Header**: Checkbox with "select all" functionality  
**Behavior**:
- Individual row checkbox: toggle single instrument selection
- Header checkbox: 
  - Checked = all instruments selected
  - Indeterminate = some instruments selected
  - Unchecked = no instruments selected

**Implementation**: Use Material-UI `Checkbox` component with `padding="checkbox"` on `TableCell`

## Interaction Rules

### Selection Flow

#### 1. Individual Selection
- User clicks checkbox on a row
- Instrument ID is added/removed from `selectedInstrumentIds` state
- Toolbar appears/disappears based on selection count
- Row visual feedback (optional highlight)

#### 2. Select All
- User clicks header checkbox
- All visible instruments are selected/deselected
- `selectedInstrumentIds` updated to match all `instrumento.id` values
- Toolbar visibility updated

#### 3. Selection Persistence
- Selection persists when dialog remains open
- Selection cleared when:
  - Dialog closes (`open` prop becomes `false`)
  - Successful move operation completes
  - User explicitly clears selection

### Create New OS Flow

#### Step 1: Initiate Action
- User clicks "Gerar nova OS" button
- Frontend validates:
  - At least one instrument selected
  - Origin OS exists and is not finalized/cancelled
- If valid, proceed to Step 2

#### Step 2: Open Creation Dialog
- Open dialog with:
  - Title: "Gerar nova OS e mover instrumentos"
  - Summary: List of selected instruments (tags/descriptions)
  - **OS Type Selection**: Dropdown/Select field with options:
    - CAL (Calibração)
    - BAL (Balanças)
    - MAN (Manutenção)
    - EXT (Serviços Externos)
  - Info message: "A nova OS será criada com o tipo selecionado e pertencerá à mesma proposta."
  - "Confirmar" and "Cancelar" buttons
- Default selected type: Origin OS type (optional, user can change)

#### Step 3: Execute Creation and Move
- User selects OS type
- User clicks "Confirmar"
- Show loading state
- Call `POST /ordens-servico/{osId}/reallocar/` with:
  ```json
  {
    "instrumento_ids": [1, 2, 3],
    "tipo_os": "CAL"
  }
  ```
- Handle success:
  - Show success snackbar with new OS number
  - Close creation dialog
  - Clear selection
  - Refetch OS details (`refetch()`)
  - Optionally: offer to open new OS details
- Handle error:
  - Show error snackbar with backend message
  - Keep dialog open for retry
  - Keep selection intact

### Cancelation Flow

- User clicks "Cancelar" in creation dialog
- Close the dialog
- **Selection behavior**: Keep selection intact (user may want to retry)
- Return to table view

## State Management

### Component State

Add to `OrdemServicoDetailsDialog`:

```javascript
// Selection state
const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([]);

// Dialog state
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [selectedOsType, setSelectedOsType] = useState(null);

// Loading state
const [isCreatingOS, setIsCreatingOS] = useState(false);
```

### Selection Helpers

```javascript
// Check if instrument is selected
const isInstrumentSelected = (instrumentoId) => {
  return selectedInstrumentIds.includes(instrumentoId);
};

// Toggle single instrument selection
const handleToggleInstrument = (instrumentoId) => {
  setSelectedInstrumentIds(prev => {
    if (prev.includes(instrumentoId)) {
      return prev.filter(id => id !== instrumentoId);
    }
    return [...prev, instrumentoId];
  });
};

// Select all visible instruments
const handleSelectAll = () => {
  const allIds = items.map(item => item.instrumento?.id).filter(Boolean);
  if (selectedInstrumentIds.length === allIds.length) {
    setSelectedInstrumentIds([]); // Deselect all
  } else {
    setSelectedInstrumentIds(allIds); // Select all
  }
};

// Clear selection
const handleClearSelection = () => {
  setSelectedInstrumentIds([]);
};
```

### Effect for Selection Cleanup

```javascript
// Clear selection when dialog closes
useEffect(() => {
  if (!open) {
    setSelectedInstrumentIds([]);
    setCreateDialogOpen(false);
    setSelectedOsType(null);
  }
}, [open]);
```

## Integration with Backend

### New Mutations in `useOrdemServicoMutations.js`

Add the following mutation:

```javascript
// Create new OS and move instruments
const createNewOSAndMove = async ({ osId, instrumentoIds, tipoOs }) => {
  const response = await axios.post(
    `/ordens-servico/${osId}/reallocar/`,
    {
      instrumento_ids: instrumentoIds,
      tipo_os: tipoOs
    }
  );
  return response.data;
};
```

### React Query Integration

Use `useMutation` for the create operation:

```javascript
const {
  mutate: createNewOSAndMove,
  isLoading: isCreatingOS,
} = useMutation({
  mutationFn: createNewOSAndMove,
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({ queryKey: ['ordem-servico', variables.osId] });
    queryClient.invalidateQueries({ queryKey: ['ordem-servico'] });
    enqueueSnackbar(
      `Nova OS ${data.destination_os_numero} criada e ${variables.instrumentoIds.length} instrumento(s) movido(s) com sucesso!`,
      { variant: 'success' }
    );
    setSelectedInstrumentIds([]);
    setCreateDialogOpen(false);
    setSelectedOsType(null);
    refetch(); // Refetch current OS details
  },
  onError: (error) => {
    const errorMessage = error?.response?.data?.detail || 'Falha ao criar nova OS e mover instrumentos.';
    enqueueSnackbar(errorMessage, { variant: 'error' });
  },
});
```

### Query Invalidation

After successful move operations:
- Invalidate `['ordem-servico', osId]` - Current OS details
- Invalidate `['ordem-servico']` - OS list (if visible elsewhere)
- Call `refetch()` on `useOrdemServico` hook to refresh table

## UI Updates After Success

### Table Refresh
- Call `refetch()` from `useOrdemServico` hook
- Table automatically updates with new instrument list
- Moved instruments disappear from current OS table

### Selection Cleanup
- Clear `selectedInstrumentIds` state
- Hide bulk actions toolbar
- Close creation dialog
- Reset OS type selection

### User Feedback
- Success snackbar: "Nova OS {numero} criada e X instrumento(s) movido(s) com sucesso"
- Show destination OS number in success message
- Optional: Action button in snackbar to open new OS details

### Edge Case: Empty OS
- If all instruments are moved, table shows "Nenhum instrumento associado"
- OS remains in system (backend handles empty OS state)
- User can still view OS details (empty state)

## Component Structure

### Modified Components

#### `OrdemServicoDetailsDialog.jsx`
- Add checkbox column to table
- Add bulk actions toolbar (only "Gerar nova OS" button)
- Add selection state management
- Add create new OS dialog
- Integrate with mutation

### New Components (Recommended)

#### `CreateNewOSDialog.jsx`
**Purpose**: Dialog for creating new OS with type selection  
**Props**:
- `open: boolean`
- `onClose: () => void`
- `selectedInstruments: Array` - Selected instrument data
- `originOsType: string` - Origin OS type (for default selection)
- `onConfirm: (tipoOs: string) => void`
- `loading: boolean`

**Content**:
- Summary of selected instruments (list or count)
- OS Type Select field:
  - Label: "Tipo de OS"
  - Options: CAL, BAL, MAN, EXT
  - Default: Origin OS type (optional)
  - Required field
- Info message about proposal linkage
- "Confirmar" and "Cancelar" buttons

**Validation**:
- OS type must be selected before confirming
- Disable confirm button if no type selected or loading

### Table Column Modification

Modify `OS_LAYOUTS` to prepend checkbox column:

```javascript
// Add checkbox column as first column in all layouts
const addCheckboxColumn = (columns) => [
  {
    key: 'checkbox',
    header: '', // Will be rendered with select-all checkbox
    render: (row, index, ...rest) => (
      <Checkbox
        checked={isInstrumentSelected(row.instrumento?.id)}
        onChange={() => handleToggleInstrument(row.instrumento?.id)}
        onClick={(e) => e.stopPropagation()} // Prevent row click
      />
    ),
  },
  ...columns,
];
```

Or add checkbox column directly in table rendering:

```javascript
<TableHead>
  <TableRow>
    <TableCell padding="checkbox">
      <Checkbox
        indeterminate={selectedInstrumentIds.length > 0 && selectedInstrumentIds.length < items.length}
        checked={items.length > 0 && selectedInstrumentIds.length === items.length}
        onChange={handleSelectAll}
      />
    </TableCell>
    {layout.columns.map((col) => (
      <TableCell key={col.key} sx={{ fontWeight: 600 }}>
        {col.header}
      </TableCell>
    ))}
  </TableRow>
</TableHead>
```

## Edge Cases & Error Handling

### No Instruments Selected
- **Scenario**: User clicks action button without selection
- **Handling**: Disable button when `selectedInstrumentIds.length === 0`
- **UI**: Button grayed out, tooltip: "Selecione pelo menos um instrumento"

### Invalid OS Type
- **Scenario**: Backend rejects invalid type (shouldn't happen if frontend validates)
- **Handling**: Display backend error message in snackbar
- **UI**: Show error snackbar, keep dialog open for user to select valid type

### Missing OS Type
- **Scenario**: User tries to confirm without selecting type
- **Handling**: Disable confirm button until type is selected
- **UI**: Show validation message or disable button

### Backend Validation Errors
- **Scenario**: Backend rejects move (e.g., OS finalized, invalid instruments)
- **Handling**: Display backend error message in snackbar
- **UI**: Keep selection and dialog open for user to retry or cancel

### Network Errors
- **Scenario**: Request fails (timeout, network error)
- **Handling**: Show generic error message, allow retry
- **UI**: Show error snackbar, keep dialog open

### Concurrent Modifications
- **Scenario**: Another user moves instruments while current user has selection
- **Handling**: On refetch, clear selection if selected instruments no longer exist
- **UI**: Show info message: "Alguns instrumentos selecionados não estão mais disponíveis"

### Empty OS After Move
- **Scenario**: All instruments moved, OS becomes empty
- **Handling**: Table shows empty state, OS remains in system
- **UI**: "Nenhum instrumento associado" message in table

### Selection Inconsistency After Refetch
- **Scenario**: After refetch, selected IDs may not match current data
- **Handling**: Filter `selectedInstrumentIds` to only include IDs that exist in current `items`
- **UI**: Auto-cleanup selection on refetch

## Acceptance Criteria

### Selection Functionality
- [ ] Checkbox column appears as first column in instrument table
- [ ] User can select individual instruments via row checkbox
- [ ] User can select all instruments via header checkbox
- [ ] Header checkbox shows indeterminate state when some instruments selected
- [ ] Selection state persists while dialog remains open
- [ ] Selection clears when dialog closes

### Bulk Actions Toolbar
- [ ] Toolbar appears when at least one instrument is selected
- [ ] Toolbar shows selection count
- [ ] "Gerar nova OS" button is visible and enabled
- [ ] Toolbar hides when selection is cleared

### Create New OS Flow
- [ ] Clicking "Gerar nova OS" opens creation dialog
- [ ] Dialog shows summary of selected instruments
- [ ] Dialog includes OS type selection field (dropdown/select)
- [ ] User can select OS type (CAL, BAL, MAN, EXT)
- [ ] User can confirm the creation
- [ ] On success, new OS is created and instruments are moved
- [ ] On success, instruments are removed from current OS table
- [ ] On success, success message shows new OS number
- [ ] On error, error message is displayed and selection remains

### UI Updates
- [ ] Table refreshes after successful move operation
- [ ] Moved instruments disappear from table immediately
- [ ] Success snackbar appears with appropriate message
- [ ] Error snackbar appears with backend error message
- [ ] Loading states are shown during API calls

### Edge Cases
- [ ] Button is disabled when no instruments selected
- [ ] OS type selection is required before confirming
- [ ] Backend validation errors are displayed to user
- [ ] Network errors allow retry
- [ ] Selection is cleared when dialog closes
- [ ] Empty OS state is displayed correctly

## Technical Implementation Notes

### Checkbox Integration Pattern

Follow the pattern from `InstrumentoTable.jsx`:

```javascript
// State
const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([]);

// Row checkbox
<TableCell padding="checkbox">
  <Checkbox
    size="small"
    checked={selectedInstrumentIds.includes(item.instrumento?.id)}
    onChange={() => handleToggleInstrument(item.instrumento?.id)}
    onClick={(e) => e.stopPropagation()} // Prevent row click if table rows are clickable
  />
</TableCell>

// Header checkbox
<TableCell padding="checkbox">
  <Checkbox
    size="small"
    indeterminate={selectedInstrumentIds.length > 0 && selectedInstrumentIds.length < items.length}
    checked={items.length > 0 && selectedInstrumentIds.length === items.length}
    onChange={handleSelectAll}
  />
</TableCell>
```

### OS Type Selection Pattern

Use Material-UI `Select` or `RadioGroup` for type selection:

```javascript
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const OS_TYPES = [
  { value: 'CAL', label: 'Calibração' },
  { value: 'BAL', label: 'Balanças' },
  { value: 'MAN', label: 'Manutenção' },
  { value: 'EXT', label: 'Serviços Externos' },
];

<FormControl fullWidth required>
  <InputLabel>Tipo de OS</InputLabel>
  <Select
    value={selectedOsType || ''}
    onChange={(e) => setSelectedOsType(e.target.value)}
    label="Tipo de OS"
  >
    {OS_TYPES.map((type) => (
      <MenuItem key={type.value} value={type.value}>
        {type.label}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

### Dialog Pattern

Use Material-UI `Dialog` component following existing patterns:

```javascript
<Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
  <DialogTitle>Gerar nova OS e mover instrumentos</DialogTitle>
  <DialogContent>
    {/* Selected instruments summary */}
    {/* OS type selection */}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
    <Button 
      onClick={() => handleConfirmCreateNewOS(selectedOsType)} 
      variant="contained"
      disabled={!selectedOsType || isCreatingOS}
    >
      Confirmar
    </Button>
  </DialogActions>
</Dialog>
```

### Permission Check

The backend requires `gerente` group membership. Frontend should:
- Only show bulk actions if user has appropriate permissions
- Handle 403 errors gracefully
- Consider checking user permissions before showing UI (optional, backend enforces)

### Performance Considerations

- **Large selections**: If OS has many instruments, consider virtualizing the list in creation dialog
- **Refetch optimization**: Use `refetch()` instead of full query invalidation when possible
- **Selection state**: Use Set for O(1) lookup if selection grows large (current array approach is fine for typical sizes)

## Open Questions

1. **Selection persistence**: Should selection persist if user closes and reopens dialog? (Proposed: No, clear on close)
2. **Empty OS handling**: Should empty OS be auto-cancelled or kept? (Backend decision, frontend just displays state)
3. **Default OS type**: Should default type be origin OS type or empty? (Proposed: Origin OS type as default, user can change)
4. **Success navigation**: Should we offer to open destination OS details after move? (Proposed: Optional, via snackbar action)
5. **Bulk operations limit**: Is there a maximum number of instruments that can be moved at once? (Backend may enforce, frontend should handle gracefully)

## Related Documentation

- Backend API: `/docs/features/backend/os/reassign-instruments/plan.md`
- Component: `frontend/src/equipe/components/OrdemServicoDetailsDialog.jsx`
- Hooks: `frontend/src/equipe/hooks/useOrdemServicoMutations.js`
- Similar patterns: `frontend/src/assets/components/InstrumentoTable.jsx`
