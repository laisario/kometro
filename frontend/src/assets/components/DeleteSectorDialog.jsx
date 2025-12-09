import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

// Helper to flatten setor tree and get all instruments
const flattenSetores = (setores, excludeId = null) => {
  const result = [];
  const traverse = (items, depth = 0) => {
    items?.forEach((item) => {
      if (item.itemType === 'sector' && String(item.id) !== String(excludeId)) {
        result.push({
          id: item.id,
          label: item.label,
          depth,
        });
      }
      if (item.children?.length) {
        traverse(item.children, depth + 1);
      }
    });
  };
  traverse(setores);
  return result;
};

// Helper to get instruments from a setor
const getInstrumentsFromSetor = (setores, setorId) => {
  const instruments = [];
  const findSetor = (items) => {
    for (const item of items || []) {
      if (String(item.id) === String(setorId)) {
        item.children?.forEach((child) => {
          if (child.itemType === 'instrument') {
            instruments.push({
              id: child.id.replace('instrument-', ''),
              tag: child.label,
            });
          }
        });
        return true;
      }
      if (item.children?.length && findSetor(item.children)) {
        return true;
      }
    }
    return false;
  };
  findSetor(setores);
  return instruments;
};

export default function DeleteSectorDialog({
  open,
  onClose,
  onConfirm,
  sectorId,
  sectorName,
  setores = [],
}) {
  const [action, setAction] = useState('transfer_existing'); // 'delete_all', 'transfer_existing', 'transfer_new'
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [targetSetor, setTargetSetor] = useState(null);
  const [newSetorName, setNewSetorName] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get instruments from the setor being deleted
  const instruments = useMemo(() => {
    return getInstrumentsFromSetor(setores, sectorId);
  }, [setores, sectorId]);

  // Get available setores (excluding the one being deleted)
  const availableSetores = useMemo(() => {
    return flattenSetores(setores, sectorId);
  }, [setores, sectorId]);

  // Initialize selected instruments when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedInstruments(instruments.map((i) => i.id));
      setAction('transfer_existing');
      setTargetSetor(null);
      setNewSetorName('');
      setShowConfirmDialog(false);
    }
  }, [open, instruments]);

  const handleSelectAll = () => {
    setSelectedInstruments(instruments.map((i) => i.id));
  };

  const handleDeselectAll = () => {
    setSelectedInstruments([]);
  };

  const handleToggleInstrument = (instrumentId) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrumentId)
        ? prev.filter((id) => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const isAllSelected = selectedInstruments.length === instruments.length;
  const isNoneSelected = selectedInstruments.length === 0;

  const instrumentsToMove = instruments.filter((i) => selectedInstruments.includes(i.id));
  const instrumentsToDelete = instruments.filter((i) => !selectedInstruments.includes(i.id));

  const canConfirm = () => {
    if (action === 'delete_all') return true;
    if (action === 'transfer_existing') return !!targetSetor;
    if (action === 'transfer_new') return newSetorName.trim().length > 0;
    return false;
  };

  const handleShowConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    // If no instruments, just delete the setor without any action
    const effectiveAction = instruments?.length === 0 ? 'delete_all' : action;
    
    const data = {
      action: effectiveAction,
      instrumentsToMove: instrumentsToMove.map((i) => i.id),
      instrumentsToDelete: instrumentsToDelete.map((i) => i.id),
      targetSetorId: effectiveAction === 'transfer_existing' ? targetSetor?.id : null,
      newSetorName: effectiveAction === 'transfer_new' ? newSetorName.trim() : null,
    };
    onConfirm(data);
    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningAmberIcon color="warning" />
          <Typography variant="h6" fontWeight={600}>
            Excluir setor "{sectorName}"
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {instruments.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Este setor não possui instrumentos. Ele será excluído diretamente.
          </Alert>
        ) : (
          <>
            {/* Action Selection */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              O que deseja fazer com os instrumentos?
            </Typography>
            
            <RadioGroup
              value={action}
              onChange={(e) => setAction(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="transfer_existing"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <DriveFileMoveIcon fontSize="small" color="primary" />
                    <span>Transferir instrumentos selecionados para um setor existente</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="transfer_new"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <CreateNewFolderIcon fontSize="small" color="success" />
                    <span>Transferir instrumentos selecionados para um novo setor</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="delete_all"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <DeleteForeverIcon fontSize="small" color="error" />
                    <span>Excluir permanentemente todos os instrumentos</span>
                  </Box>
                }
              />
            </RadioGroup>

            {/* Transfer destination */}
            {action === 'transfer_existing' && (
              <Autocomplete
                options={availableSetores}
                getOptionLabel={(option) => option.label}
                value={targetSetor}
                onChange={(_, newValue) => setTargetSetor(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecione o setor de destino"
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography sx={{ pl: option.depth * 2 }}>
                      {option.label}
                    </Typography>
                  </li>
                )}
                sx={{ mb: 2 }}
              />
            )}

            {action === 'transfer_new' && (
              <TextField
                label="Nome do novo setor"
                variant="outlined"
                size="small"
                fullWidth
                value={newSetorName}
                onChange={(e) => setNewSetorName(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            <Divider sx={{ my: 2 }} />

            {/* Instrument Selection */}
            {action !== 'delete_all' && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Selecione os instrumentos para transferir
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      onClick={handleSelectAll}
                      disabled={isAllSelected}
                      sx={{ mr: 1 }}
                    >
                      Selecionar todos
                    </Button>
                    <Button
                      size="small"
                      onClick={handleDeselectAll}
                      disabled={isNoneSelected}
                      color="inherit"
                    >
                      Desmarcar todos
                    </Button>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  Instrumentos selecionados serão transferidos. Os não selecionados serão{' '}
                  <strong>excluídos permanentemente</strong>.
                </Typography>

                <Paper 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: 300, 
                    overflow: 'auto',
                    mb: 2,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'action.hover',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'primary.main',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <List dense disablePadding>
                    {instruments.map((instrument) => (
                      <ListItem
                        key={instrument.id}
                        button
                        onClick={() => handleToggleInstrument(instrument.id)}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                          bgcolor: selectedInstruments.includes(instrument.id)
                            ? 'action.selected'
                            : 'transparent',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox
                            edge="start"
                            checked={selectedInstruments.includes(instrument.id)}
                            tabIndex={-1}
                            disableRipple
                            size="small"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={instrument.tag || 'Sem tag'}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                {/* Summary */}
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip
                    icon={<DriveFileMoveIcon />}
                    label={`${instrumentsToMove.length} para transferir`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<DeleteForeverIcon />}
                    label={`${instrumentsToDelete.length} para excluir`}
                    color={instrumentsToDelete.length > 0 ? 'error' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </>
            )}

            {action === 'delete_all' && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <strong>Atenção!</strong> Todos os {instruments.length} instrumentos deste setor
                serão excluídos permanentemente. Essa ação não pode ser desfeita.
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleShowConfirmDialog}
          color="error"
          variant="contained"
          disabled={instruments.length > 0 && !canConfirm()}
          startIcon={action === 'delete_all' ? <DeleteForeverIcon /> : <DriveFileMoveIcon />}
        >
          {instruments.length === 0
            ? 'Excluir setor'
            : action === 'delete_all'
            ? 'Excluir tudo'
            : 'Confirmar'}
        </Button>
      </DialogActions>

      <ConfirmDeleteDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleFinalConfirm}
        type="sector"
      />
    </Dialog>
  );
}

