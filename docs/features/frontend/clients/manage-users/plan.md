# Feature: Manage Client Users (Frontend)

## Feature Summary

UI to remove existing users from a client and invite new users via the existing invitation system. Located in the client details page users card.

## User Value

### Problem Solved
Team administrators need to manage user access directly from the client details page without navigating elsewhere.

### Who Benefits
- **Team Managers**: Remove user access quickly
- **Administrators**: Generate invite links

## Scope

### In Scope
- Remove button per user in client users card
- Confirmation dialog before removal
- "Convidar" button in users card
- Invite dialog with group selection
- Copy invite URL to clipboard

### Out of Scope
- Bulk user operations
- User editing

## User Flow

### Remove User Flow
1. Admin views client details
2. Admin sees users card with user list
3. Admin clicks remove icon on a user
4. Confirmation dialog appears
5. Admin confirms removal
6. System removes user, refreshes list
7. Success snackbar shows

### Invite User Flow
1. Admin clicks "Convidar" button in users card
2. Dialog opens with group selection
3. Admin selects group (gerente/registrador/observador)
4. Admin clicks "Gerar convite"
5. System generates invitation URL
6. Admin clicks "Copiar"
7. URL copied to clipboard, confirmation shown

## Acceptance Criteria

- [ ] Each user shows remove button
- [ ] Remove button triggers confirmation dialog
- [ ] Confirmation shows warning about permanent deletion
- [ ] Confirm removal deletes user from system
- [ ] Users list refreshes after deletion
- [ ] "Convidar" button in users card header
- [ ] Invite dialog shows group options
- [ ] Generated URL can be copied
- [ ] Copy shows success snackbar

## Frontend Behavior

### Screens/Components

#### ClientInformation.jsx (Modified)
- Add remove button per user
- Add "Convidar" button in card header
- State: managingUser (ID of user being removed)

#### Components to Create
- `RemoveUserDialog.jsx` — Confirmation dialog
- `InviteUserDialog.jsx` — Group selection + invite URL display

### Remove Dialog Component

```jsx
<Dialog open={!!managingUser} onClose={() => setManagingUser(null)}>
  <DialogTitle>Excluir usuário {username}?</DialogTitle>
  <DialogContent>
    <Typography>
      Isso excluirá permanentemente {username} do sistema. 
      Esta ação é IRREVERSÍVEL.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setManagingUser(null)}>Cancelar</Button>
    <Button onClick={handleRemove} disabled={isRemoving}>
      {isRemoving ? 'Excluindo...' : 'Excluir'}
    </Button>
  </DialogActions>
</Dialog>
```

### Invite Dialog Component

```jsx
<Dialog open={open} onClose={onClose}>
  <DialogTitle>Convidar novo usuário</DialogTitle>
  <DialogContent>
    <TextField
      select
      label="Grupo"
      value={selectedGroup}
      onChange={(e) => setSelectedGroup(e.target.value)}
    >
      <MenuItem value={1}>Gerente</MenuItem>
      <MenuItem value={2}>Registrador</MenuItem>
      <MenuItem value={3}>Observador</MenuItem>
    </TextField>
    
    {inviteUrl && (
      <TextField
        value={inviteUrl}
        InputProps={{
          endAdornment: <IconButton onClick={copyToClipboard}><ContentCopy /></IconButton>
        }}
      />
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Fechar</Button>
    <Button onClick={generateInvite} disabled={isGenerating}>
      {isGenerating ? 'Gerando...' : 'Gerar convite'}
    </Button>
  </DialogActions>
</Dialog>
```

### Key States

#### Remove User
| State | Behavior |
|-------|----------|
| Initial | Remove button visible per user |
| Confirming | Dialog open |
| Removing | Button disabled, loading |
| Removed | Dialog closes, list refreshes, snackbar |
| Error | Snackbar shows error |

#### Invite User
| State | Behavior |
|-------|----------|
| Initial | "Convidar" button visible |
| Selecting | Dialog open, group dropdown |
| Generating | Button loading |
| Generated | URL displayed, copy button visible |
| Copied | Snackbar "Link copiado!" |
| Error | Snackbar shows error |

### API Integration

#### Remove User
- Endpoint: DELETE `/clientes/{clienteId}/usuarios/{userId}/`
- Hook: Add to `useClientMutations`

```javascript
const { mutate: removeUser, isLoading: isRemoving } = useMutation({
  mutationFn: ({ clienteId, userId }) => 
    axios.delete(`/clientes/${clienteId}/usuarios/${userId}/`),
  onSuccess: () => {
    queryClient.invalidateQueries(['clientes', clienteId]);
    enqueueSnackbar('Usuário excluído', { variant: 'success' });
  }
});
```

#### Generate Invite
- Endpoint: POST `/invites/create/`
- Existing hook: Use or extend `useInvitesMutations`

```javascript
const { mutate: createInvite, isLoading: isGenerating } = useMutation({
  mutationFn: ({ grupo, cliente }) => 
    axios.post('/invites/create/', { grupo, cliente }),
  onSuccess: ({ data }) => {
    setInviteUrl(data.convite_url);
  }
});
```

## Permissions

- **Admin Only**: Remove users
- **Admin Only**: Generate invites
- Button hidden for non-admin users

## State Management

- React Query for client data
- Local state for dialogs: `managingUser`, `inviteDialogOpen`
- `useMutation` for remove/create invite

## Edge Cases & Failures

### Remove User
- User not found: Show error snackbar
- Network error: Show error snackbar
- Self-removal attempt: Show warning, prevent
- Confirm deletion is permanent: User is deleted, not just unlinked

### Invite User
- No group selected: Disable generate button
- Network error: Show error snackbar
- Already used: Already handled by existing flow

## Implementation Checklist

- [ ] Add remove button to ClientInformation for each user
- [ ] Create RemoveUserDialog component
- [ ] Add "Convidar" button to users card header
- [ ] Create InviteUserDialog component
- [ ] Add removeUser mutation to useClientMutations
- [ ] Handle loading/error states
- [ ] Test: Remove user flow (verify user is deleted)
- [ ] Test: Invite user flow