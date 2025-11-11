import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import dayjs from 'dayjs';
import { capitalizeFirstLetter as CFL, titleCase } from '../../utils/formatString';
import FilesSelection from './FilesSelection';
import { statusMessages, statusColor, statusString } from '../../utils/proposals';
import { localLabels } from '../../utils/assets';
import ProposalDetailsPreview from './ProposalDetailsPreview';



function InformationProposol(props) {
  const { 
    data, 
    isMobile, 
    admin, 
  } = props;
  const [openAnexos, setOpenAnexos] = useState(false)
  const [openProposals, setOpenProposals] = useState(false)

  const handleCloseAnexo = () => {
    setOpenAnexos(false)
  }

  const handleCloseProposal = () => {
    setOpenProposals(false)
  }

  const handleOpenAnexos = () => setOpenAnexos(true)
  const handleOpenProposals = () => setOpenProposals(true)

  const message = statusMessages(admin)[data?.status]

  const mappedAnexos = useMemo(() => data?.anexos?.map(({ anexo }) => ({url: anexo})), [data?.anexos])
  const mappedProposals = useMemo(() =>data?.revisoes?.map((rev) => ({ url: rev?.pdf, rev: rev?.rev })), [data?.revisoes])

  return (
    <Grid container  flexDirection={'column-reverse'}>
      <ProposalDetailsPreview data={data} admin={admin} isMobile={isMobile} />
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 2 : 0}  flexDirection="row" gap={2}>
        <Box display="flex" flexDirection="row" gap={1}>
          <FilesSelection open={openAnexos} handleClose={handleCloseAnexo} arr={mappedAnexos} title={data?.anexos?.length > 1 ? 'Anexos' : 'Anexo'} />
          <FilesSelection open={openProposals} handleClose={handleCloseProposal} arr={mappedProposals} title={data?.revisoes?.length > 1 ? 'Propostas' : 'Proposta'} />
          {!!data?.revisoes?.length && <Tooltip placement="right-end" title="Clique para abrir pdf da proposta">
            <Button
              startIcon={<PreviewIcon fontSize="small" />}
              target="_blank"
              onClick={handleOpenProposals}
              color='secondary'
              variant="outlined"
              size="small"
            >
              {data?.revisoes?.length > 1 ? 'Propostas' : 'Proposta'}
            </Button>
          </Tooltip>}
          {!!data?.anexos?.length && (
            <Tooltip placement="right-end" title="Clique para ver documento anexado">
              <Button startIcon={<DownloadIcon fontSize="small" />} size="small" onClick={handleOpenAnexos} target="_blank" color='secondary' variant="outlined">
                {data?.anexos?.length > 1 ? 'Anexos' : 'Anexo'}
              </Button>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Tooltip title={message}>
            <Chip
              label={statusString[data?.status]}
              color={statusColor[data?.status]}
              variant="filled"
              sx={{ color: '#fff' }}
            />
          </Tooltip>
          {data?.dataAprovacao && data?.status !== "AA" && data?.status !== "E" && (
            <Typography variant='overline' fontSize={10} color="grey.400" >Em {dayjs(data?.dataAprovacao).locale('pt-BR').format('DD/MM/YYYY')}</Typography>
          )}
        </Box>
      </Box>
    </Grid >
  )
}

export default InformationProposol