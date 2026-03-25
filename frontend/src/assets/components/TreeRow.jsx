import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Box, IconButton, Tooltip, CircularProgress, TextField } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import FolderRounded from '@mui/icons-material/FolderRounded';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useAuth from '../../auth/hooks/useAuth';
import { NO_PERMISSION_ACTION } from '../../utils/messages';

const RowContainer = styled(Box)(({ theme, isSelected, depth }) => ({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: `${depth * 24 + 8}px`,
  paddingRight: theme.spacing(1),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  cursor: 'pointer',
  userSelect: 'none',
  borderRadius: theme.spacing(0.7),
  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  fontWeight: 500,
  transition: 'background-color 0.2s',
  backgroundColor: isSelected 
    ? theme.palette.primary.dark
    : 'transparent',
  color: isSelected 
    ? theme.palette.primary.contrastText
    : theme.palette.grey[400],
  ...theme.applyStyles('light', {
    color: isSelected 
      ? theme.palette.primary.contrastText
      : theme.palette.grey[800],
    backgroundColor: isSelected 
      ? theme.palette.primary.main
      : 'transparent',
  }),
  '&:hover': {
    backgroundColor: isSelected 
      ? theme.palette.primary.dark
      : alpha(theme.palette.primary.main, 0.1),
    color: isSelected 
      ? theme.palette.primary.contrastText
      : 'white',
    ...theme.applyStyles('light', {
      color: isSelected 
        ? theme.palette.primary.contrastText
        : theme.palette.primary.main,
      backgroundColor: isSelected 
        ? theme.palette.primary.main
        : alpha(theme.palette.primary.main, 0.1),
    }),
  },
}));

const DotIcon = styled(Box)(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: '70%',
  backgroundColor: theme.palette.warning.main,
  display: 'inline-block',
  verticalAlign: 'middle',
  marginLeft: theme.spacing(1),
}));

/**
 * Componente de row memoizado para virtualização
 * Recebe apenas dados primitivos e callbacks estáveis
 */
const TreeRow = React.memo(function TreeRow({
  id,
  node,
  depth,
  isExpanded,
  isSelected,
  isLoading,
  hasChildren,
  isEditing,
  onToggle,
  onSelect,
  onCreateSubsector,
  onEdit,
  onDelete,
  onDuplicate,
  onRename,
  onCancelEdit,
  style,
}) {
  const { hasCreatePermission, hasEditPermission, hasDeletePermission } = useAuth();
  
  // State for inline editing
  const [editValue, setEditValue] = useState(node.label);
  const inputRef = useRef(null);
  
  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Update editValue when node.label changes
  useEffect(() => {
    setEditValue(node.label);
  }, [node.label]);
  
  const isSector = node.type === 'sector';
  const isInstrument = node.type === 'instrument';
  
  // Handler de click no row
  const handleRowClick = useCallback((e) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect(id);
      if (isSector && hasChildren) {
        onToggle(id);
      }
    }
  }, [id, isSector, hasChildren, onSelect, onToggle, isEditing]);
  
  // Handlers de ações
  const handleCreateSubsector = useCallback((e) => {
    e.stopPropagation();
    onCreateSubsector && onCreateSubsector(id);
  }, [id, onCreateSubsector]);
  
  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit && onEdit(id);
  }, [id, onEdit]);
  
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete && onDelete(id);
  }, [id, onDelete]);
  
  const handleDuplicate = useCallback((e) => {
    e.stopPropagation();
    if (isInstrument) {
      const originalId = id.split('-')[1];
      onDuplicate && onDuplicate(originalId);
    }
  }, [id, isInstrument, onDuplicate]);
  
  // Inline editing handlers
  const handleConfirmEdit = useCallback((e) => {
    e?.stopPropagation();
    if (editValue.trim() && editValue !== node.label) {
      onRename && onRename(id, editValue.trim());
    } else {
      onCancelEdit && onCancelEdit();
    }
  }, [id, editValue, node.label, onRename, onCancelEdit]);
  
  const handleCancelEdit = useCallback((e) => {
    e?.stopPropagation();
    setEditValue(node.label);
    onCancelEdit && onCancelEdit();
  }, [node.label, onCancelEdit]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmEdit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit(e);
    }
  }, [handleConfirmEdit, handleCancelEdit]);
  
  // Ícone baseado no tipo
  const Icon = useMemo(() => {
    if (isSector) return FolderRounded;
    if (isInstrument) return ArticleIcon;
    return FolderRounded;
  }, [isSector, isInstrument]);
  
  return (
    <div style={style} data-selected={isSelected}>
      <RowContainer
        isSelected={isSelected}
        depth={depth}
        onClick={handleRowClick}
      >
        {/* Ícone de expansão */}
        {isSector && hasChildren && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
            {isLoading ? (
              <CircularProgress size={16} />
            ) : isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </Box>
        )}
        
        {/* Ícone do tipo */}
        <Icon
          sx={{ 
            mr: 1, 
            fontSize: '1.2rem',
            color: 'inherit'
          }}
        />
        
        {/* Label ou Input (para edição) */}
        {isEditing ? (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              inputRef={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              size="small"
              autoFocus
              variant="outlined"
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                  fontSize: 'inherit',
                },
                '& .MuiOutlinedInput-input': {
                  padding: '4px 8px',
                },
              }}
            />
            <IconButton 
              size="small" 
              onClick={handleConfirmEdit}
              sx={{ color: 'success.main' }}
              aria-label="Confirmar"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={handleCancelEdit}
              sx={{ color: 'error.main' }}
              aria-label="Cancelar"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.label}
            </Box>
            {isSector && hasChildren && <DotIcon />}
          </Box>
        )}
        
        {/* Ações (apenas se selecionado e não editando) */}
        {isSelected && !isEditing && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            {isSector && (
              <>
                <Tooltip title={hasCreatePermission ? 'Criar Subsetor' : NO_PERMISSION_ACTION}>
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={!hasCreatePermission}
                      onClick={handleCreateSubsector}
                      sx={{ color: 'inherit' }}
                      aria-label="Criar Subsetor"
                    >
                      <AddIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={hasEditPermission ? 'Editar nome' : NO_PERMISSION_ACTION}>
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={!hasEditPermission}
                      onClick={handleEdit}
                      sx={{ color: 'inherit' }}
                      aria-label="Editar"
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={hasDeletePermission ? 'Deletar' : NO_PERMISSION_ACTION}>
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={!hasDeletePermission}
                      onClick={handleDelete}
                      sx={{ color: 'inherit' }}
                      aria-label="Deletar"
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
            
            {isInstrument && (
              <Tooltip title={hasCreatePermission ? 'Duplicar instrumento' : NO_PERMISSION_ACTION}>
                <span>
                  <IconButton 
                    size="small" 
                    disabled={!hasCreatePermission}
                    onClick={handleDuplicate}
                    sx={{ color: 'inherit' }}
                  >
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        )}
      </RowContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.depth === nextProps.depth &&
    prevProps.hasChildren === nextProps.hasChildren &&
    prevProps.node.label === nextProps.node.label &&
    prevProps.style === nextProps.style
  );
});

export default TreeRow;
