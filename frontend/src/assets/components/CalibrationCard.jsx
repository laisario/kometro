import { Box, Button, Card, CardActions, CardContent, CircularProgress, Divider, alpha } from '@mui/material';
import React, { useState } from 'react';
import AttachmentIcon from '@mui/icons-material/Attachment';
import { fDate } from '../../utils/formatTime';
import CriticalAnalysisDialog from './CriticalAnalysisDialog';
import ContentRow from '../../components/ContentRowCard';
import Label from '../../components/label';
import { statusColor, statusLabel, analiseCriticaColor, analiseCriticaLabel } from '../../utils/calibration';
import { truncateString } from '../../utils/formatString';
import Attachment from '../../components/Attachment';
import Certificates from './Certificates';
import useAssetMutations from '../hooks/useAssetMutations'

function CalibrationCard({ calibration, theme, isMobile }) {
  const [open, setOpen] = useState(false);
  const [analiseCliente, setAnaliseCliete] = useState({
    criticalAnalysis: "A",
    restriction: '',
  });
  const [readMore, setReadMore] = useState({
    readMoreObservation: { readMore: false, readUntil: 15 },
    readMoreCriticalAnalisys: { readMore: false, readUntil: 15 },
    readMoreCertificate: false,
  });
  
  const { 
    mutateCriticalAnalisys, 
    isLoadingCriticalAnalisys, 
  } = useAssetMutations();

  const toggleReadMore = (field, readMore, readUntil = 15) => {
    setReadMore((prevValues) => ({
      ...prevValues,
      [field]: { readMore, readUntil: readMore ? null : readUntil },
    }));
  };
  
  const handleConfirmationAnalysis = (analiseCritica) => {
    mutateCriticalAnalisys({ idCalibration: calibration?.id, analiseCliente: analiseCritica });
    handleClose();
  };
  
  const handleChange = (event) => {
    setAnaliseCliete((prevValue) => ({ ...prevValue, [event.target.name]: event.target.value }));
  };
  
  const handleClose = () => {
    setOpen(false);
    setAnaliseCliete({ criticalAnalysis: "A", restriction: '' });
  };
  const readMoreObservation = () => toggleReadMore('readMoreObservation', true);
  const readLessObservation = () => toggleReadMore('readMoreObservation', false);

  const readMoreCriticalAnalisys = () => toggleReadMore('readMoreCriticalAnalisys', true);
  const readLessCriticalAnalisys = () => toggleReadMore('readMoreCriticalAnalisys', false);

  const readMoreCertificates = () => toggleReadMore('readMoreCertificate', true);
  const readLessCertificates = () => toggleReadMore('readMoreCertificate', false);

  const certificado = !!calibration?.ContentRowcertificados?.length && calibration?.certificados[0]

  return (
    <Card 
      sx={{ 
        backgroundColor: theme.palette.background.neutral, 
        minWidth: isMobile ? '100%' : '35%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between' 
      }}
    >
      <CardContent>
        {(!!calibration?.data || !!calibration?.status) &&
          <ContentRow title={calibration?.ordemDeServico} value={fDate(calibration?.data, "dd/MM/yy")} />}
        {calibration?.local && (
          <ContentRow title="Local" value={calibration?.local} />
        )}
        { !!calibration?.setor && (
          <ContentRow title="Setor" value={calibration?.setor?.nome} />
        )}
        {calibration?.observacoes && (
          <ContentRow title="Observações:" isMobile={readMore?.readMoreObservation?.readMore} value={truncateString(calibration?.observacoes, readMore?.readMoreObservation?.readUntil)} />
        )}
        {(calibration?.observacoes?.length > 15)
          && <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-end' }}>
            <Button sx={{ color: 'black', p: 0 }} onClick={readMore?.readMoreObservation?.readMore ? readLessObservation : readMoreObservation}>{readMore?.readMoreObservation?.readMore ? 'Ler menos' : 'Ler mais'}</Button>
          </Box>}
        {calibration?.status
          && <ContentRow title="Resultado" colorTitle='black' my={1} value={<Label color={statusColor[calibration?.status]}>{statusLabel[calibration?.status]}</Label>} />
        }
        {calibration?.maiorErro && (
          <ContentRow title="Maior erro" value={calibration?.maiorErro} />
        )}
        {calibration?.incerteza && (
          <ContentRow title="Incerteza" value={calibration?.incerteza} />
        )}
        {(calibration?.analiseCritica)
          && <ContentRow title={calibration?.analiseCritica !== "P" ? "Sua análise crítica" : "Análise critica"} colorTitle='black' my={1} value={<Label color={analiseCriticaColor[calibration?.analiseCritica]}>{analiseCriticaLabel[calibration?.analiseCritica]}</Label>} />}
        {calibration?.restricaoAnaliseCritica && (
          <>
            <ContentRow 
              title="Restrição:" 
              isMobile={readMore?.readMoreCriticalAnalisys?.readMore} 
              value={truncateString(calibration?.restricaoAnaliseCritica, readMore?.readMoreCriticalAnalisys?.readUntil)} 
            />
            {(calibration?.restricaoAnaliseCritica?.length > 15)
              && <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  sx={{ color: 'black', p: 0 }} 
                  onClick={readMore?.readMoreCriticalAnalisys?.readMore 
                    ? readLessCriticalAnalisys 
                    : readMoreCriticalAnalisys
                  }
                >
                  {readMore?.readMoreCriticalAnalisys?.readMore ? 'Ler menos' : 'Ler mais'}
                </Button>
              </Box>}
          </>
        )}
        {!!calibration?.certificados?.length && <Divider orientation={"horizontal"} flexItem sx={{ my: 1 }} />}
        {!!calibration?.certificados?.length && (
          <Box>
            <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), p: 2, borderRadius: 2 }}>
              {certificado?.numero && <ContentRow colorTitle='black' title="Certificado:" value={<Attachment url={certificado?.arquivo} content={certificado?.numero} />} />}
              {(certificado?.anexos?.map(({ anexo, id }, index) => (
                <ContentRow key={id + index} my={0} title={`Anexo ${index + 1}`} value={<Attachment url={anexo} content={<AttachmentIcon fontSize='small' />} />} />
              )))}
            </Box>
            {(calibration?.certificados?.length > 1)
              && <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <Button sx={{ color: 'black' }} onClick={readMoreCertificates}>Ver todos</Button>
              </Box>}
          </Box>)}
        <Certificates
          certificados={calibration?.certificados || []}
          open={readMore?.readMoreCertificate?.readMore}
          handleClose={readLessCertificates}
          isMobile={isMobile}
        />
      </CardContent>
      {calibration?.analiseCritica === "P" && (
        <CardActions sx={{ display: "flex", justifyContent: calibration?.analiseCritica === "P" ? "flex-end" : "space-between", m: 1 }}>
          {isLoadingCriticalAnalisys 
            ? <CircularProgress />
            : <Button onClick={() => setOpen(true)}>Análise Crítica</Button>
          }
          <CriticalAnalysisDialog
            open={open}
            handleClose={handleClose}
            handleConfirmationAnalysis={handleConfirmationAnalysis}
            analiseCliente={analiseCliente}
            setAnaliseCliete={setAnaliseCliete}
            handleChange={handleChange}
          />
        </CardActions>
      )}
    </Card>
  );
}

export default CalibrationCard;
