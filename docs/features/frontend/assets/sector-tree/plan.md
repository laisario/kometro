# Feature: Sector Tree

## Feature Summary

Interactive tree view component displaying the sector hierarchy for navigating and filtering instruments by organizational structure.

## User Value

### Problem Solved
Users need to navigate large instrument inventories by organizational structure rather than scrolling through flat lists.

### Who Benefits
- **All Users**: Navigate by department/area
- **Quality Managers**: View organization structure

## Scope

### In Scope
- Hierarchical tree display
- Expandable/collapsible nodes
- Instrument count per sector
- Click to filter instruments
- Current selection highlighting

### Out of Scope
- Tree editing
- Drag-and-drop reorganization

## User Flow

### Primary Flow
1. User opens instruments page
2. Tree loads with collapsed hierarchy
3. User expands sectors of interest
4. User clicks sector to filter table
5. Table shows only that sector's instruments

### Alternate Flows

#### Empty Sector
- Shows sector with (0) count
- Clicking shows empty table state

## Acceptance Criteria

- [ ] Renders nested hierarchy correctly
- [ ] Shows expand/collapse icons
- [ ] Displays instrument count per sector
- [ ] Clicking filters instrument table
- [ ] Selected sector highlighted
- [ ] "All" option clears filter

## Frontend Behavior

### Screens/Components
- `SetorTree.jsx` — Tree container
- `CustomTreeItem.jsx` — Tree node component

### Key States
- **Loading**: Skeleton tree
- **Loaded**: Full hierarchy
- **Selected**: Node highlighted
- **Expanded**: Children visible

## Data & Permissions

### Entities Touched
- `Setor` — Read (hierarchy)

### Permissions
- **All Authenticated Users**: View tree

## Edge Cases & Failures

### Missing Data
- No sectors: "Nenhum setor" message

### Network/Integration Failures
- Load failure: Error message

## Observability

### Logs/Events
- Sector selections logged

## Open Questions

- [ ] Should tree remember expanded state?

