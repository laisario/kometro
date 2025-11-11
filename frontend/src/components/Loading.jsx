import { Box, CircularProgress } from '@mui/material'
import React from 'react'

function Loading() {
  return (
    <Box display="flex" height="70vh" width="100%" justifyContent="center" alignItems="center" spacing={3}>
      <CircularProgress size="96px" />
    </Box>
  )
}

export default Loading