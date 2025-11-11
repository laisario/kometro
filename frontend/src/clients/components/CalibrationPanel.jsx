import { Stack, Box, Button, Divider, CircularProgress } from '@mui/material'
import React from 'react'
import Calibrations from './Calibrations';
import PreviewCalibration from './PreviewCalibration';
import useCalibration from '../hooks/useCalibration';

function CalibrationPanel(props) {
  const {
    mutateDeleteCalibration,
    isDeletingCalibration,
    isLoadingCreation,
    mutateEdit,
    isLoadingEdit,
    mutateAddCertificate,
    isLoadingAddCertificate,
    mutateDeleteCertificate,
    isLoadingDeleteCertificate,
    selectedCalibration,
    setSelectedCalibration,
    form,
    openEdit,
    setOpenEdit,
    openCreateCertificate,
    setOpenCreateCertificate,
    error,
    setError,
    isMobile,
    checagem,
    debouncedSearch,
    assetId
  } = props;
  
  const { data: calibrations, isLoadingCalibrations } = useCalibration(null, debouncedSearch, assetId, checagem)
  
  return (
    <Stack flexDirection={isMobile ? 'column' : 'row'} width="100%" gap={2} divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />} justifyContent='space-between'>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : '50%', gap: 2 }}>
        {isLoadingCreation 
          ? <CircularProgress /> 
          : (
            <Calibrations
              calibrations={calibrations} 
              isMobile={isMobile} 
              selectedCalibration={selectedCalibration} 
              setSelectedCalibration={setSelectedCalibration}
              isLoadingCalibrations={isLoadingCalibrations}
              checagem={checagem}
            />
          )
        }
      </Box>
      <PreviewCalibration
        mutateEdit={mutateEdit}
        isLoadingEdit={isLoadingEdit}
        isMobile={isMobile}
        deleteCalibration={mutateDeleteCalibration}
        isDeleting={isDeletingCalibration}
        calibration={selectedCalibration}
        setSelectedCalibration={setSelectedCalibration}
        mutateAddCertificate={mutateAddCertificate}
        isLoadingAddCertificate={isLoadingAddCertificate}
        mutateDeleteCertificate={mutateDeleteCertificate}
        isLoadingDeleteCertificate={isLoadingDeleteCertificate}
        openEdit={openEdit}
        setOpenEdit={setOpenEdit}
        openCreateCertificate={openCreateCertificate}
        setOpenCreateCertificate={setOpenCreateCertificate}
        form={form}
        error={error}
        setError={setError}
        checagem={checagem}
      />
    </Stack>
  )
}

export default CalibrationPanel