import { IconButton, Tooltip } from '@mui/material'
import React from 'react'

function ButtonTooltip({ title, action, icon, disabled }) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton disabled={disabled} size="small" onClick={action}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default ButtonTooltip