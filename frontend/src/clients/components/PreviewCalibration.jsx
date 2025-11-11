import React from 'react'
import { Box, Typography } from '@mui/material'
import Calibration from './Calibration'

function PreviewCalibration(props) {
  const {
    calibration,
    isMobile,
    isDeleting,
    deleteCalibration,
    mutateEdit,
    isLoadingEdit,
    mutateAddCertificate,
    isLoadingAddCertificate,
    mutateDeleteCertificate,
    isLoadingDeleteCertificate,
    setSelectedCalibration,
    openEdit,
    setOpenEdit,
    openCreateCertificate,
    setOpenCreateCertificate,
    form,
    error,
    setError,
    checagem
  } = props;
  return (
    <Box sx={{
      width: isMobile ? '100%' : '68%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
    }}>
      {!Object?.keys(calibration)?.length
        ? <Typography color='grey' fontWeight={400} textAlign="center">Selecione uma {checagem ? 'checagem' : 'calibração'} para visualizá-la</Typography>
        : (
          <Calibration
            isMobile={isMobile}
            calibration={calibration}
            mutateEdit={mutateEdit}
            isLoadingEdit={isLoadingEdit}
            isDeleting={isDeleting}
            deleteCalibration={deleteCalibration}
            mutateAddCertificate={mutateAddCertificate}
            isLoadingAddCertificate={isLoadingAddCertificate}
            mutateDeleteCertificate={mutateDeleteCertificate}
            isLoadingDeleteCertificate={isLoadingDeleteCertificate}
            setSelectedCalibration={setSelectedCalibration}   openEdit={openEdit}
            setOpenEdit={setOpenEdit}
            openCreateCertificate={openCreateCertificate}
            setOpenCreateCertificate={setOpenCreateCertificate}
            form={form}
            error={error}
            setError={setError}
            checagem={checagem}
          />
      )
      }
    </Box>
  )
}

export default PreviewCalibration