import React, { useContext } from 'react';
import { useParams } from 'react-router';
import { Box, Chip, Container, Divider, Paper, Stack, Typography, Card } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '@emotion/react';
import { fDate } from '../../utils/formatTime';
import CalibrationCard from '../components/CalibrationCard';
import ContentRow from '../../components/ContentRowCard';
import { positionLabels, colorPositionInstrument, localLabels } from '../../utils/assets';
import useAsset from '../hooks/useAsset';
import Loading from '../../components/Loading';

function AssetDetailPage() {
  const { id } = useParams();
  const theme = useTheme();
 
  const {
    asset, 
    isMobile,
    isLoadingAsset
  } = useAsset(id);

  const modelo = asset?.instrumento?.tipoDeInstrumento?.modelo
  const fabricante = asset?.instrumento?.tipoDeInstrumento?.fabricante
  return (
    <>
      <Helmet>
        <title> Instrumento | Kometro </title>
      </Helmet>
      {isLoadingAsset ? <Loading /> : (
        <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box direction="column">
            {!!asset?.tag &&
              <Typography variant="h4" gutterBottom>
                {asset?.tag}
              </Typography>
            }
            {!!asset?.numeroDeSerie &&
              <Typography variant="h6" gutterBottom>
                {asset?.numeroDeSerie}
              </Typography>
            }
          </Box>
        </Stack>
        <Paper sx={{ padding: 4 }}>
          <Stack
            flexDirection={isMobile ? 'column' : 'row'} 
            gap={2} 
            divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />} 
            justifyContent='space-between'
            padding={2}
            borderRadius={2}
          >
            <Box width="100%">
              {(!!asset?.instrumento?.tipoDeInstrumento?.descricao || !!modelo) && <ContentRow title={asset?.instrumento.tipoDeInstrumento.descricao} value={!!modelo && modelo} />}
              {!!fabricante && <ContentRow title="Fabricante" value={fabricante} />}
              {(asset?.instrumento?.minimo || asset?.instrumento?.maximo)
                && <ContentRow title="Faixa de medição" value={`${asset?.instrumento?.minimo} ${!!asset?.instrumento?.maximo && `- ${asset?.instrumento?.maximo}`} ${asset?.instrumento?.unidade}`} />}
              {!!asset?.instrumento?.tipoDeInstrumento?.resolucao && <ContentRow title="Resolução" value={asset?.instrumento?.tipoDeInstrumento?.resolucao} />}
              {!!asset?.laboratorio && <ContentRow title="Laboratório" value={asset?.laboratorio} />}
              {asset?.local && <ContentRow title="Local" value={localLabels[asset?.local]} />}
              {asset?.diasUteis && <ContentRow title="Dias úteis" value={asset?.diasUteis} />}
            </Box>
            <Box width="100%">
              {!!asset?.instrumento?.procedimentoRelacionado?.codigo && <ContentRow title="Procedimento relacionado" value={asset?.instrumento?.procedimentoRelacionado?.codigo} />}
              {!!asset?.instrumento?.capacidadeDeMedicao?.valor && <ContentRow title="Capacidade de medição" value={`${asset?.instrumento?.capacidadeDeMedicao?.valor} ${asset?.instrumento?.capacidadeDeMedicao?.unidade}`} />}
              {!!asset?.dataUltimaCalibracao && <ContentRow title="Última calibração" value={fDate(asset?.dataUltimaCalibracao, "dd/MM/yy")} />}
              {!!asset?.dataProximaCalibracao && <ContentRow title="Próxima calibração" value={fDate(asset?.dataProximaCalibracao, "dd/MM/yy")} />}
              {!!asset?.dataProximaChecagem && <ContentRow title="Próxima checagem" value={fDate(asset?.dataProximaChecagem, "dd/MM/yy")} />}
              {!!asset?.frequencia && <ContentRow title="Frequência" value={`${asset?.frequencia} ${+(asset?.frequencia) > 1 ? 'meses' : 'mês'}`} />}
              {!!asset?.pontosDeCalibracao?.length && <ContentRow title="Pontos de calibração:" isMobile value={asset?.pontosDeCalibracao?.map(({ nome }) => nome).join(", ")} />}
            </Box>
            <Box display="flex" flexWrap='wrap' gap={1} flexDirection={isMobile ? 'row' : "column"} justifyContent="flex-start">
              <Chip
                label={positionLabels[asset?.posicao]}
                color={colorPositionInstrument[asset?.posicao]}
                variant="filled"
                sx={{ color: theme.palette.common.white }}
              />
              <Chip
                label={asset?.instrumento?.tipoDeServico === 'A' ? 'Acreditado' : 'Não acreditado'}
                variant="filled"
                color={asset?.instrumento?.tipoDeServico === 'A' ? 'info' : 'primary'}
                sx={{ color: theme.palette.common.white }}
              />
              <Chip
                label={`Expira ${fDate(asset?.dataProximaCalibracao)}`}
                variant="filled"
                color={'warning'}
                sx={{ color: theme.palette.common.white }}
              />
            </Box>
          </Stack>
          {!!asset?.calibracoes?.length && (
            <>
              <Typography variant="h6" my={2}>
                Calibrações
              </Typography>
              <Box display="flex" gap={2} sx={{ overflowX: 'auto' }} width="100%">
                {asset?.calibracoes?.map(
                  (calibration, i) => (
                    <CalibrationCard
                      calibration={calibration}
                      theme={theme}
                      isMobile={isMobile}
                      key={calibration?.id + i}
                    />
                  )
                )}
              </Box>
            </>
          )}
          {!!asset?.observacoes && (
            <>
              <Typography my={2} variant="h6">
                Observação
              </Typography>
              <Card sx={{ padding: 2, my: 2, backgroundColor: theme.palette.background.neutral }}>
                <Typography>{asset?.observacoes}</Typography>
              </Card>
            </>
          )}
        </Paper>
        </Container>
      )}
    </>
  );
}

export default AssetDetailPage