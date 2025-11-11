import React from 'react'
import { Checkbox, TableCell, TableHead, TableRow } from '@mui/material';


function TableHeader({ onSelectAllClick, numSelected, rowCount, checkbox, headCells }) {
  return (
    <TableHead>
      <TableRow>
        {checkbox && <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>}
        {headCells?.map((headCell) => (
          <TableCell
            key={headCell.id}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default TableHeader;