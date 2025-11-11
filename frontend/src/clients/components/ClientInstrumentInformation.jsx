import React, { useState } from 'react'
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  CircularProgress,
  Tab,
  Button,
} from '@mui/material'
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CalibrationPanel from './CalibrationPanel';
import AssetInformation from '../../components/AssetInformation';
import CreateInstrument from '../../assets/components/CreateInstrument';
import useCalibrationMutation from '../hooks/useCalibrationMutation';
import RecordList from '../../assets/components/RecordList';


function ClientInstrumentInformation(props) {
  const { 
    instrument, 
    mutateDelete, 
    isDeleting, 
    defaultAssets,
    searchDA,
    setSearchDA,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    mutateEditInstrument,
    isFetching,
    error,
    setError,
    editFormState,
    handleCloseFormEdit,
    handleOpenFormEdit,
  } = props;


  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel${instrument?.id}-content`}
        id={`instrument-${instrument?.id}`}
      >
        <Box>
          <Typography variant='subtitle1'>
            {instrument?.tag && instrument.tag}
            {instrument?.tag && instrument?.numeroDeSerie && ' | '}
            {instrument?.numeroDeSerie && `Nº série: ${instrument.numeroDeSerie}`}
          </Typography>

          <Typography variant='body2' fontWeight="500">
            {instrument?.instrumento?.tipoDeInstrumento?.descricao}{instrument?.instrumento?.tipoDeInstrumento?.modelo && `, ${instrument?.instrumento?.tipoDeInstrumento?.modelo}`} {instrument?.instrumento?.tipoDeInstrumento?.fabricante && `- ${instrument?.instrumento?.tipoDeInstrumento?.fabricante}`}
          </Typography>

          {(instrument?.instrumento?.maximo || instrument?.instrumento?.minimo) && (
            <Typography variant='body2' fontWeight="500" color="text.secondary">
              {instrument?.instrumento?.maximo !== null ? `${instrument?.instrumento?.minimo} - ${instrument?.instrumento?.maximo}` : `${instrument?.instrumento?.minimo}`} {instrument?.instrumento?.unidade}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <RecordList asset={instrument} adminPreview />
      </AccordionDetails>
      <AccordionActions>
        <Button variant="outlined" onClick={() => handleOpenFormEdit(instrument)} size="small" startIcon={<EditIcon />}>Editar instrumento</Button>
        <CreateInstrument
          handleClose={handleCloseFormEdit}
          open={editFormState?.open && editFormState?.instrument?.id === instrument?.id}
          asset={instrument}
          defaultAssets={defaultAssets}
          search={searchDA}
          setSearch={setSearchDA}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          cliente={instrument?.cliente?.id}
          mutate={mutateEditInstrument}
          isFetching={isFetching}
          error={error}
          setError={setError}
          adminPreview
        />
        {isDeleting ? <CircularProgress /> : <Button variant="contained" size="small" onClick={() => mutateDelete(instrument?.id)} endIcon={<DeleteForeverIcon />}>Excluir instrumento</Button>}
      </AccordionActions>
    </Accordion>
  )
}

export default ClientInstrumentInformation 