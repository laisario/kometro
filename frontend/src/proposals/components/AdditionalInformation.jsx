import { Box, Card, Typography, useTheme } from '@mui/material'
import React from 'react'

function AdditionalInformation({data}) {
  const theme = useTheme();
  return (
    <Box>
      <Typography my={2} variant="h6">
        Informações Adicionais
      </Typography>
      <Card 
        sx={{ 
          padding: 2, 
          my: 2, 
          backgroundColor: 
          theme.palette.background.neutral 
        }}
      >
        <Typography>{data?.informacoesAdicionais}</Typography>
      </Card>
    </Box>
  )
}

export default AdditionalInformation