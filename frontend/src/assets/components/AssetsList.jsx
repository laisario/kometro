import React from 'react'
import { Paper, Box, Collapse, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import AssetCard from './AssetCard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function Row({row}) {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.nome}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              {row?.subsetores?.length 
                ? (
                  <TableBody>
                    {row.subsetores.map((subsetor) => (
                      <>
                        <TableRow key={subsetor.id}>
                        <TableCell>
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                          >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                          <TableCell component="th" scope="row">
                            {subsetor.nome}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Collapse in={open} timeout="auto" unmountOnExit>
                            
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </>
                    ))}
                  </TableBody>
                )
                : row?.instrumentos?.length 
                  ? (<div>aa</div>) 
                  : <Typography>Nada dentro deste setor.</Typography>
              }
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}


function AssetsList({ sectors, setSelected, selected, ...other }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell align="left">Setores</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sectors.map((row) => (
            <Row key={row.nome} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


export default AssetsList
