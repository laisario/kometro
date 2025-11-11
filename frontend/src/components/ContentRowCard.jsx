import { Box, Typography } from '@mui/material';

export default function ContentRow({ title, value, isMobile, colorTitle = 'grey', colorValue= 'grey', my= 0 }) {
  return (
    <Box 
      display="flex" 
      my={my} 
      flexDirection={isMobile ? 'column' : 'row'} 
      justifyContent={isMobile ? "flex-start" : "space-between"}
    >
      <Typography fontWeight="900" color={colorTitle} variant="body2">
        {title}
      </Typography>
      <Typography fontWeight="400" color={colorValue} variant="body2">
        {value}
      </Typography>
    </Box>
  )
}