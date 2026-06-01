import { 
  Avatar, 
  CircularProgress, 
  Divider, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Typography
} from '@mui/material';
import { FixedSizeList } from 'react-window';
import React, { useEffect, useRef } from 'react'
import { fDate } from '../../utils/formatTime';


function Calibrations(props) {
  const { 
    calibrations, 
    setSelectedCalibration, 
    selectedCalibration,
    isLoadingCalibrations,
    checagem,
  } = props;
  const listRef = useRef(null);

  useEffect(() => {
    if (!selectedCalibration?.id || !calibrations?.length || !listRef.current) return;

    const selectedIndex = calibrations.findIndex(
      (calibration) => String(calibration?.id) === String(selectedCalibration.id)
    );

    if (selectedIndex >= 0) {
      listRef.current.scrollToItem(selectedIndex, 'center');
    }
  }, [calibrations, selectedCalibration?.id]);
  
  function renderRow(props) {
    const { index, style } = props;
    return (
      <div key={index + calibrations[index]?.id}>
        <ListItem style={style} disablePadding onClick={() => setSelectedCalibration(calibrations[index])} sx={{ bgcolor: selectedCalibration?.id === calibrations[index]?.id ? 'background.neutral' : 'background.paper', }}>
          <ListItemAvatar  sx={{p: 1}}>
            <Avatar >
              os
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={calibrations[index]?.ordemDeServico || `${index + 1}°`} secondary={fDate(calibrations[index]?.data)} />
        </ListItem>
        <Divider variant="inset" component="li" />
      </div>
    );
  }

  return (
    <List sx={{
      width: '100%',
      overflow: 'auto',
      maxHeight: 'auto'
    }}>
      {isLoadingCalibrations ? <CircularProgress /> : !calibrations?.length 
        ? <Typography color='grey' fontWeight={400} textAlign='center'>{checagem ? "Nenhuma checagem cadastrada" : "Nenhuma calibração cadastrada"}</Typography> 
        : (
          <FixedSizeList
            ref={listRef}
            height={300}
            width="100%"
            itemSize={55}
            itemCount={calibrations?.length}
            overscanCount={3}
          >
            {renderRow}
          </FixedSizeList>
        )
      }
    </List>
  );
}

export default Calibrations
