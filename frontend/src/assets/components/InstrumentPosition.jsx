import {
  Stack,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useRef, useState } from 'react';
import useAuth from '../../auth/hooks/useAuth';
import LockIcon from '@mui/icons-material/Lock';

function InstrumentPosition({instrumento, positionMap, mutateChangePosition}) {
  const [posicao, setPosicao] = useState(instrumento?.posicao);
  const [anchorEl, setAnchorEl] = useState(null);
  const triggerRef = useRef(null);
  const { hasEditPermission } = useAuth();

  const handleToggleMenu = (event) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(triggerRef.current);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleChangePosicao = async (novaPosicao) => {
    setPosicao(novaPosicao);

    mutateChangePosition({
      id: instrumento?.id,
      novaPosicao,
    });

    handleCloseMenu();
  };

  return (
    instrumento?.posicao && (
      <Stack direction="row" alignItems="center">
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={handleToggleMenu}
          ref={triggerRef}
        >
          <Chip
            label={positionMap[posicao]?.label || 'Desconhecido'}
            color={positionMap[posicao]?.color || 'default'}
          />
          <ArrowDropDownIcon fontSize="small" />
        </div>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {Object.entries(positionMap)
            .filter(([key]) => key !== posicao)
            .map(([key, value]) => (
              <MenuItem
                key={key}
                onClick={() => handleChangePosicao(key)}
                disabled={!hasEditPermission}
              >
                {!hasEditPermission && <ListItemIcon><LockIcon fontSize='small' /></ListItemIcon>}
                {value.label}
              </MenuItem>
            ))}
        </Menu>
      </Stack>
    )
  );
}

export default InstrumentPosition