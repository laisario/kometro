import { Box } from '@mui/material'
import React from 'react'

function Row({ children, isMobile }) {
  return (
    <Box 
      display="flex" 
      flexDirection={isMobile ? 'column' : 'row'} 
      my={1} 
      gap={1} 
    >
      {children}
    </Box>
  )
}

export default Row