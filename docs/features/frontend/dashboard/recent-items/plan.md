# Feature: Recent Items

## Feature Summary

Lists of recent instruments (for clients) and recent proposals showing latest activity.

## User Value

### Problem Solved
Users need quick access to recently added or modified items.

### Who Benefits
- **All Users**: Navigate to recent work

## Scope

### In Scope
- Recent instruments list (clients)
- Recent proposals list
- Quick navigation links

### Out of Scope
- Activity feed
- Change history

## User Flow

### Primary Flow
1. User views dashboard
2. Recent items displayed
3. User clicks item to navigate

## Acceptance Criteria

- [ ] Shows last 5 instruments (clients)
- [ ] Shows last 5 proposals
- [ ] Clicking navigates to detail

## Frontend Behavior

### Screens/Components
- Dashboard recent items section

### Key States
- **Loading**: Skeleton list
- **Loaded**: Items displayed
- **Empty**: No recent items

## Data & Permissions

### Entities Touched
- Dashboard API — Read

### Permissions
- **All Authenticated Users**: View own recent items

## Edge Cases & Failures

### Missing Data
- No items: Empty message

## Observability

### Logs/Events
- Item clicks logged

## Open Questions

- [ ] Should this be configurable?

