import * as React from 'react';
import { animated, useSpring } from '@react-spring/web';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderRounded from '@mui/icons-material/FolderRounded';
import { useTreeItem } from '@mui/x-tree-view/useTreeItem';
import {
  TreeItemIconContainer,
  TreeItemLabel,
} from '@mui/x-tree-view/TreeItem';
import { TreeItemIcon } from '@mui/x-tree-view/TreeItemIcon';
import { TreeItemProvider } from '@mui/x-tree-view/TreeItemProvider';
import { useTreeItemModel } from '@mui/x-tree-view/hooks';
import { IconButton, Input, InputAdornment, Stack, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { NO_PERMISSION_ACTION } from '../../utils/messages';
import useAuth from '../../auth/hooks/useAuth';

function DotIcon() {
  return (
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: '70%',
        bgcolor: 'warning.main',
        display: 'inline-block',
        verticalAlign: 'middle',
        zIndex: 1,
        mx: 1,
      }}
    />
  );
}

const TreeItemRoot = styled('li')(({ theme }) => ({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  outline: 0,
  color: theme.palette.grey[400],
  ...theme.applyStyles('light', {
    color: theme.palette.grey[800],
  }),
}));

const TreeItemContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(0.5),
  paddingRight: theme.spacing(1),
  paddingLeft: `calc(${theme.spacing(1)} + var(--TreeView-itemChildrenIndentation) * var(--TreeView-itemDepth))`,
  width: '100%',
  boxSizing: 'border-box', // prevent width + padding to overflow
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  flexDirection: 'row-reverse',
  borderRadius: theme.spacing(0.7),
  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  fontWeight: 500,
  '&[data-expanded]:not([data-focused], [data-selected]) .labelIcon': {
    color: theme.palette.primary.dark,
    ...theme.applyStyles('light', {
      color: theme.palette.primary.main,
    }),
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      left: '16px',
      top: '44px',
      height: 'calc(100% - 48px)',
      width: '1.5px',
      backgroundColor: theme.palette.grey[700],
      ...theme.applyStyles('light', {
        backgroundColor: theme.palette.grey[300],
      }),
    },
  },
  [`&[data-focused], &[data-selected]`]: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    ...theme.applyStyles('light', {
      backgroundColor: theme.palette.primary.main,
    }),
  },
  '&:not([data-focused], [data-selected]):hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: 'white',
    ...theme.applyStyles('light', {
      color: theme.palette.primary.main,
    }),
  },
}));

const CustomCollapse = styled(Collapse)({
  padding: 0,
});

const AnimatedCollapse = animated(CustomCollapse);

function TransitionComponent(props) {
  const style = useSpring({
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(0,${props.in ? 0 : 20}px,0)`,
    },
  });

  return <AnimatedCollapse style={style} {...props} />;
}

const TreeItemLabelText = styled(Typography)({
  color: 'inherit',
  fontWeight: 500,
});

function CustomLabel({ 
    icon: Icon, 
    expandable, 
    children, 
    handleCreate, 
    itemId, 
    selectedItem, 
    onDeleteSetor, 
    handleEditSector, 
    setSelectedItem, 
    handleEdit,
    duplicateInstrument,
    ...other
  }) {
  const [open, setOpen] = React.useState(false)
  const { hasCreatePermission, hasEditPermission, hasDeletePermission } = useAuth();

  return (
    <TreeItemLabel
      {...other}
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {Icon && (
        <Box
          component={Icon}
          className="labelIcon"
          color="inherit"
          sx={{ mr: 1, fontSize: '1.2rem' }}
        />
      )}
      <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <TreeItemLabelText variant="body2">{children}</TreeItemLabelText>
          {expandable && <DotIcon />}
        </Box>
        {selectedItem?.id === itemId && selectedItem?.type === 'sector' &&  <Box m={0} p={0} sx={{zIndex: 999}}>
          <Tooltip title={hasCreatePermission ? 'Criar Subsetor' : NO_PERMISSION_ACTION}>
            <span>
              <IconButton disabled={!hasCreatePermission} size="small" onClick={(e) => { e.stopPropagation(); handleCreate(selectedItem); }}>
                <AddIcon fontSize="inherit" style={{color: 'white'}} />
              </IconButton>
            </span>
          </Tooltip>
        
          <Tooltip title={hasEditPermission ? 'Editar nome' : NO_PERMISSION_ACTION}>
            <span>
              <IconButton size="small" disabled={!hasEditPermission} onClick={(e) => { e.stopPropagation(); handleEdit(selectedItem); }}>
                <EditIcon fontSize="inherit" style={{color: 'white'}} />
              </IconButton>
            </span>
          </Tooltip>
        
          <Tooltip title={hasDeletePermission ?  'Deletar' : NO_PERMISSION_ACTION}>
            <span>
              <IconButton disabled={!hasDeletePermission} size="small" onClick={(e) => { e.stopPropagation(); setOpen(true) }}>
                <DeleteIcon fontSize="inherit" style={{color: 'white'}} />
              </IconButton>
            </span>
          </Tooltip>

          <ConfirmDeleteDialog
            open={open}
            onClose={() => setOpen(false)}
            type="sector"
            onConfirm={() => {onDeleteSetor({id: selectedItem?.id}); setSelectedItem(null)}}
          />
          
        </Box>}
        {selectedItem?.id === itemId && selectedItem?.type === 'instrument' && (
          <Box m={0} p={0} sx={{zIndex: 999}}>
            <Tooltip title={hasCreatePermission ? 'Duplicar instrumento' : NO_PERMISSION_ACTION} placement='top'>
              <span>
                <IconButton disabled={!hasCreatePermission} size="small" onClick={(e) => { e.stopPropagation(); duplicateInstrument(selectedItem?.id?.split('-')[1]); }}>
                  <AddIcon fontSize="inherit" style={{color: 'white'}} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
    </TreeItemLabel>
  );
}

const getIconFromItemType = (type) => {
  switch (type) {
    case 'instrument':
      return ArticleIcon;
    case 'sector':
      return FolderRounded;
    default:
      return FolderRounded;
  }
};

const CustomTreeItem = React.forwardRef(function CustomTreeItem(props, ref) {
  const { 
    id, 
    itemId, 
    label,
    disabled, 
    children,
    isEditing, 
    handleSubmit, 
    handleCreate, 
    selectedItem,
    setSelectedItem,
    onDeleteSetor, 
    handleEditSector, 
    handleEdit,
    handleCloseCreateSector,
    duplicateInstrument,
    ...other
  } = props;

  const [inputValue, setInputValue] = React.useState('');

  const {
    getContextProviderProps,
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getLabelProps,
    getGroupTransitionProps,
    status,
  } = useTreeItem({ id, itemId, children, label, disabled, rootRef: ref });

  const item = useTreeItemModel(itemId);

  
  let icon;
  if (status?.expandable) {
    icon = FolderRounded;
  } else if (item?.itemType) {
    icon = getIconFromItemType(item?.itemType);
  }

  return (
    <TreeItemProvider {...getContextProviderProps()}>
      <TreeItemRoot {...getRootProps(other)}>
        <TreeItemContent {...getContentProps()}>
          <TreeItemIconContainer {...getIconContainerProps()}>
            <TreeItemIcon status={status} />
          </TreeItemIconContainer>
          {isEditing 
            ? <Box pl="20px" width="100%" {...getLabelProps()} display="flex" >
                <Input
                  sx={{width: "100%"}}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(inputValue);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      if (!inputValue?.length) {
                        onDeleteSetor({id: selectedItem?.id});
                      }
                      setSelectedItem(null)
                      handleCloseCreateSector();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  color='secondary'
                  autoFocus
                  size="small"
                  endAdornment={
                    <Stack direction="row">
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            if (!inputValue?.length) {
                              onDeleteSetor({id: selectedItem?.id});
                            }
                            handleCloseCreateSector();
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            handleSubmit(inputValue);
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    </Stack>
                  }
                />
              </Box>
            : <CustomLabel 
                handleCreate={handleCreate}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                onDeleteSetor={onDeleteSetor}
                handleEditSector={handleEditSector}
                handleEdit={handleEdit}
                itemId={itemId}
                duplicateInstrument={duplicateInstrument}
                {...getLabelProps({
                  icon,
                  expandable: status.expandable && status.expanded,
                })}
              />
          }
        </TreeItemContent>
        {children && <TransitionComponent {...getGroupTransitionProps()} />}
      </TreeItemRoot>
    </TreeItemProvider>
  );
});

export default CustomTreeItem
