import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material'
import React from 'react'
import Iconify from '../../components/Iconify'

function FilesSelection({ handleClose, open, arr = [], title }) {
  const isProposal = title?.toLowerCase()?.includes('proposta')
  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {arr?.map((arr, i) => (
          <Button 
            key={title + i + 1} 
            variant='contained' 
            target='_blank' 
            sx={{ mr: 1 }} 
            href={arr?.url}
          >
            <Iconify icon={isProposal ? "eva:file-text-fill" : "eva:attach-fill"} />
            {isProposal ? `Rev ${arr?.rev}` : (i + 1)}
          </Button>
        ))}
      </DialogContent>
    </Dialog>
  )
}

export default FilesSelection