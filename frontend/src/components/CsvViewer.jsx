import React, { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { readString, useCSVDownloader } from "react-papaparse"
import { 
  DialogActions, 
  DialogContent, 
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  Button,
} from '@mui/material';

export default function CsvViewer({ csvContent, fileName }) {
  const [parsedCsv, setParsedCsv] = React.useState(null)
  const { CSVDownloader } = useCSVDownloader()
  const theme = useTheme()

  useEffect(() => {
    if (!csvContent) return
    readString(csvContent, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results?.errors?.length) console.log("deu ruim")
        setParsedCsv(results?.data)
      }
    })
  }, [csvContent])

  const handlePrint = () => {
    if (!parsedCsv) return;
    window.print()
  };
  if (!parsedCsv) return null

  return (
    <Dialog fullScreen PaperProps={{ sx: { width: '100%' } }} onClose={() => {setParsedCsv(null)}} open={!!parsedCsv}>
      <DialogTitle className='button'>Visualização do seu arquivo</DialogTitle>
      <DialogContent>
        <TableContainer id='print-section' component={Paper}>
          <Table id="table" sx={{ minWidth: 1200 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                {!!parsedCsv?.length && Object.keys(parsedCsv[0]).map(key => <TableCell key={key}>{key}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {parsedCsv.map((row, index) => {
                const values = Object.values(row)
                return (
                  <TableRow
                    key={index + 1}
                    sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:nth-of-type(odd)': {
                            backgroundColor: theme.palette.action.hover,
                        },
                    }}
                  >
                    {values.map((value, i) => <TableCell key={value + i} align="left">{value}</TableCell>)}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
          <Button className='button' onClick={() => {setParsedCsv(null);}} endIcon={<CloseIcon />}>Cancelar</Button>
          <Button className='button' variant='outlined' endIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>
          <CSVDownloader style={{ background: 'transparent', border: 0 }} variant="contained" type="button" filename={fileName} bom data={parsedCsv}><Button variant='contained' endIcon={<DownloadIcon />}>Download</Button></CSVDownloader>
      </DialogActions>
      <style>
              {`
                  @media print {
          @page {
              size: Legal landscape;
              margin: 1cm;
          }

          #print-section {
              width: 100%;
              transform: scale(0.95);
              transform-origin: top left;
          }

          button, .button {
              display: none;
          }

      } `}
      </style>
    </Dialog>
  );
}