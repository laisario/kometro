import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material'
import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import CardInformation from './CardInformation'
import FormAddInstrument from './FormAddInstrument';
import EmptyYet from '../../components/EmptyYet';

function Assets(props) {
  const { 
    data, 
    isMobile, 
    admin, 
    removeInstrumentProposal, 
    isRemoving,
    addInstrumentProposal,
    isLoadingAdd,
  } = props;
  const [open, setOpen] = useState(false)
  const addInstrument = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box sx={{my: isMobile ? 4 : 8}}>
      <Box display="flex" justifyContent='space-between' alignItems='center'>
        <Typography variant="h6" my={2}>
          {data?.instrumentos.length > 1 ? "Instrumentos" : "Instrumento"}
        </Typography>
        {admin && (
          isMobile
          ? <IconButton onClick={addInstrument}>
            <AddIcon />
          </IconButton>
          : <Button 
              variant="contained" 
              onClick={addInstrument} 
              color="secondary" 
              startIcon={<AddIcon />}
            >
            instrumento
            </Button>)
        }
      </Box>

      <FormAddInstrument
        open={open}
        handleClose={handleClose}
        idClient={data?.cliente?.id}
        data={data}
        addInstrumentProposal={addInstrumentProposal}
        isLoadingAdd={isLoadingAdd}
      />

      {data?.instrumentos?.length 
        ? <Box
            display="flex"  
            justifyContent={(isLoadingAdd || isRemoving) ? 'center' : 'flex-start'} 
            gap={3} 
            sx={{ overflowX: 'auto' }} 
            width="100%" 
            size={{ xs: 12, md: 4 }}
            >
              {(isLoadingAdd || isRemoving) 
                ? <CircularProgress /> 
                : data?.instrumentos?.map(
                  (instrument, index) => (
                      <CardInformation
                        instrument={instrument}
                        key={index}
                        isMobile={isMobile}
                        admin={admin}
                        removeInstrumentProposal={removeInstrumentProposal}
                      />
                  )
              )}
            </Box>
          : <EmptyYet content="instrumentosProposta" isMobile={isMobile} />
        }
    </Box>
  )
}

export default Assets