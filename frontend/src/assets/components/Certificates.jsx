import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import React from 'react'
import AttachmentIcon from '@mui/icons-material/Attachment';
import ContentRow from '../../components/ContentRowCard'
import Attachment from '../../components/Attachment'

function Certificates({ certificados, handleClose, open, isMobile }) {
  return (
    <Dialog fullScreen={isMobile} onClose={handleClose} open={open}>
      <DialogTitle>Certificados</DialogTitle>
      <DialogContent sx={{
        display: 'flex',
        gap: 2,
        width: '100%',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {!!certificados?.length &&
          certificados?.map((certificado) => (
            <Box key={certificado?.id} sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 2, width: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                {certificado?.numero && <ContentRow colorTitle='black' title="Certificado:" isMobile value={<Attachment url={certificado?.arquivo} content={certificado?.numero} />} />}
              </Box>
              {(certificado?.anexos?.map(({ anexo, id }, index) => (
                <ContentRow key={id + index} my={0} title={`Anexo ${index + 1}`} value={<Attachment url={anexo} content={<AttachmentIcon fontSize='small' />} />} />
              )))}
            </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default Certificates