import { Box, Card, Link, Typography, Stack, Chip, Divider, Radio } from '@mui/material';
import { useMemo } from 'react';
import palette from '../../theme/palette';
import { positionLabels, colorPositionInstrument } from '../../utils/assets';


export default function AssetCard({ asset, setSelected, selected }) {
  const isSelected = useMemo(() => selected.includes(asset?.id), [selected, asset])
  return (
    <Card sx={{ 
      border: isSelected ? "3px solid #555555" : 0, 
      cursor: "pointer", 
      minHeight: '250px'  
      }} 
      onClick={() => setSelected((selected) => isSelected 
        ? selected.filter(selecionado => selecionado !== asset?.id) 
        : [...selected, asset?.id]
      )}
      >
      <Box sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: "center",
        backgroundColor: palette.secondary.lighter,
        color: palette.secondary.contrastText
      }}>
        {!!asset?.tag &&
          <Typography color="white" variant='subtitle1'>{asset?.tag}</Typography>
        }
        <Radio color="secondary" sx={{ backgroundColor: "white", p: 0, border: 0, color: "white" }} checked={isSelected} />
      </Box>
      <Divider />
      <Stack sx={{ p: 3 }} gap={1}>
        {!!asset?.instrumento?.tipoDeInstrumento?.descricao &&
          <Link href={`#/dashboard/instrumento/${asset?.id}`} color="inherit" underline="hover">
            <Typography variant="subtitle1">
              {asset?.instrumento?.tipoDeInstrumento?.descricao}
            </Typography>
          </Link>
        }
        {!!asset?.instrumento?.tipoDeInstrumento?.modelo &&
          <Typography variant="subtitle2" fontWeight={300}>
            {asset?.instrumento?.tipoDeInstrumento?.modelo}
          </Typography>
        }
        {!!asset?.instrumento?.tipoDeInstrumento?.fabricante &&
          <Typography variant="caption text">
            {asset?.instrumento?.tipoDeInstrumento?.fabricante}
          </Typography>
        }
      </Stack>
      {!!asset?.posicao &&
        <Box sx={{ pr: 5, pb: 5, display: 'flex', justifyContent: 'flex-end' }}>
          <Chip sx={{ color: palette?.common?.white }} color={colorPositionInstrument[asset?.posicao]} label={positionLabels[asset?.posicao]} />
        </Box>
      }
    </Card>
  );
}
