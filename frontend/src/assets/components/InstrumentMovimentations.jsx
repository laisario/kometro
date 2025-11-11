import {
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Box,
  Typography,
  ListSubheader
} from '@mui/material';
import { colorPositionInstrument, positionLabels } from '../../utils/assets';
import { formatDateTimeBR } from '../../utils/formatTime';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';


const PositionList = ({movimentationsPosition, firstMovimentation, asset}) => {
  return (
    <List
      aria-labelledby="movimentacao-da-posicao"  
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          Movimentação da posição
        </ListSubheader>
      }
      sx={{p: 2}}
    >
      {movimentationsPosition?.map((mov, index) => {
        const usuario = mov.usuarioAlteracao?.username || mov?.usuarioAlteracao?.firstName
        return (
          <div key={index}>
            <ListItem alignItems="center">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                {mov?.antigaPosicao && (
                  <>
                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      {positionLabels[mov?.antigaPosicao] || 'Antigo posição'}
                    </Typography>
                    <ArrowDownwardIcon fontSize="small" />
                  </>
                )}
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  {positionLabels[mov?.novaPosicao] || 'Nova posição'}
                </Typography>
              </Box>
              <ListItemText
                primary={formatDateTimeBR(mov.dataAlteracao)}
                secondary={`Movimentado por: ${usuario}`}
              />
            </ListItem>
            {index < movimentationsPosition.length - 1 && <Divider component="li" />}
          </div>
        )})}
    </List>
  )
}


const SectorList = ({movimentationsSector}) => {
  return (
    <List    
      aria-labelledby="movimentacao-de-setores"  
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          Movimentação de setores
        </ListSubheader>
      }
      sx={{p: 2}}
    >
      {movimentationsSector?.map((mov, index) => {
        const usuario = mov?.usuarioAlteracao?.username || mov?.usuarioAlteracao?.first
        return (
          <div key={index}>
            <ListItem alignItems="center">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  {mov?.antigoSetor || 'Antigo setor'}
                </Typography>
                <ArrowDownwardIcon fontSize="small" />
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  {mov?.novoSetor || 'Novo setor'}
                </Typography>
              </Box>
              <ListItemText
                primary={formatDateTimeBR(mov?.dataAlteracao)}
                secondary={`Movimentado por: ${usuario}`}
              />
            </ListItem>
            {index < movimentationsSector?.length - 1 && <Divider component="li" />}
          </div>
        )})}
    </List>
  )
}


export default function Movimentations({ movimentationsPosition = [], asset, movimentationsSector, isMobile }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2}}>
      {!!movimentationsPosition?.length && <PositionList asset={asset} movimentationsPosition={movimentationsPosition} />}
      {!!movimentationsSector?.length && <SectorList movimentationsSector={movimentationsSector} />}
    </Box>
  );
}
