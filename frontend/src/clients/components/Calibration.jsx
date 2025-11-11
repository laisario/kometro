import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Divider,
  CircularProgress,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AttachmentIcon from '@mui/icons-material/Attachment';
import { fDate } from '../../utils/formatTime';
import ContentRow from '../../components/ContentRowCard';
import ButtonTooltip from '../../components/ButtonTooltip';
import { statusLabel, statusColor, analiseCriticaColor, analiseCriticaLabel } from '../../utils/calibration';
import Label from '../../components/label';
import Form from './Form';
import FormCertificate from './FormCertificate';
import Attachment from '../../components/Attachment';
import CriticalAnalysisDialog from '../../assets/components/CriticalAnalysisDialog';
import useAssetMutations from '../../assets/hooks/useAssetMutations';
import { truncateString } from '../../utils/formatString';
import { localLabels } from '../../utils/assets';
import useAuth from '../../auth/hooks/useAuth';
import { NO_PERMISSION_ACTION } from '../../utils/messages';

function Calibration(props) {
  const {
    calibration,
    isMobile,
    isDeleting,
    deleteCalibration,
    mutateEdit,
    isLoadingEdit,
    mutateAddCertificate,
    isLoadingAddCertificate,
    mutateDeleteCertificate,
    isLoadingDeleteCertificate,
    setSelectedCalibration,
    openEdit,
    setOpenEdit,
    openCreateCertificate,
    setOpenCreateCertificate,
    form,
    error,
    setError,
    checagem
  } = props;
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
  const { hasCreatePermission, hasEditPermission, hasDeletePermission } = useAuth()

  const handleClose = () => {
    setSelectedCalibration({})
    setOpenEdit(false)
  }

  const { 
    mutateCriticalAnalisys, 
    isLoadingCriticalAnalisys, 
  } = useAssetMutations(handleClose);

  const toggleReadMore = (field, readMore, readUntil = 15) => {
    setReadMore((prevValues) => ({
      ...prevValues,
      [field]: { readMore, readUntil: readMore ? null : readUntil },
    }));
  };
  
  const handleConfirmationAnalysis = (analiseCritica) => {
    mutateCriticalAnalisys({ idCalibration: calibration?.id, analiseCliente: analiseCritica });
  };
  
  const handleChange = (event) => {
    setAnaliseCliete((prevValue) => ({ ...prevValue, [event.target.name]: event.target.value }));
  };
  
  const handleCloseCriticalAnalysis = () => {
    setOpen(false);
    setAnaliseCliete({ criticalAnalysis: "A", restriction: '' });
  };

  const readMoreCriticalAnalisys = () => toggleReadMore('readMoreCriticalAnalisys', true);
  const readLessCriticalAnalisys = () => toggleReadMore('readMoreCriticalAnalisys', false);

  const handleOpenEdit = () => setOpenEdit(true)
  const handleCloseCertificate = () => setOpenCreateCertificate(false)
  const handleOpenCertificate = () => setOpenCreateCertificate(true)
  const handleDelete = () => deleteCalibration(calibration?.id)

  const deleteCertificate = (idCertificado) => {
    mutateDeleteCertificate({ id: calibration?.id, idCertificado, })
  }

  return (
    <Card sx={{
      bgcolor: 'background.default',
      width: '100%',
      maxHeight: '350px',
      overflow: "auto"
    }}>
      <CardContent sx={{ display: 'flex', gap: 2, justifyContent: "space-between", flexDirection: 'column' }}>
        <Box width={"100%"}>
          <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {isLoadingAddCertificate 
              ? <CircularProgress /> 
              : <ButtonTooltip disabled={!hasCreatePermission}  title={hasCreatePermission ? checagem ? 'Adicionar documento' : "Adicionar certificado" : NO_PERMISSION_ACTION} variant='filled' icon={<AddIcon />} action={handleOpenCertificate} />
            }
            <FormCertificate
              mutateAddCertificate={mutateAddCertificate}
              open={openCreateCertificate}
              handleClose={handleCloseCertificate}
              calibration={calibration}
              checagem={checagem}
            />
            {isLoadingEdit 
              ? <CircularProgress /> 
              : <ButtonTooltip disabled={!hasEditPermission} title={hasEditPermission ? checagem ? "Editar checagem" : "Editar calibração" : NO_PERMISSION_ACTION} action={handleOpenEdit} icon={<EditIcon />} />
            }
            <Form
              mutate={mutateEdit}
              calibration={calibration}
              open={openEdit}
              isMobile={isMobile}
              handleClose={handleClose}
              form={form}
              error={error}
              setError={setError}
              checagem={checagem}
              criterios={calibration?.instrumento?.criteriosAceitacao}
            />
            {isDeleting 
              ? <CircularProgress /> 
              : <ButtonTooltip disabled={!hasDeletePermission} title={hasDeletePermission ? checagem ? 'Apagar checagem' : "Apagar calibração" : NO_PERMISSION_ACTION} variant='filled' icon={<DeleteIcon />} action={handleDelete} />
            }
          </CardActions>
          
          {calibration?.ordemDeServico && (
            <ContentRow colorTitle='black' colorValue='black' title={calibration?.ordemDeServico?.toUpperCase()} value={fDate(calibration?.data, "dd/MM/yyyy")} />
          )}
          {calibration?.local && (
            <ContentRow title="Local" value={localLabels[calibration?.local]} />
          )}
          {calibration?.setor && (
            <ContentRow title="Setor" value={calibration?.setor?.nome} />
          )}
          {calibration?.observacoes && (
            <ContentRow isMobile title="Observações:" value={calibration?.observacoes} />
          )}
          {(calibration?.status)
            && <ContentRow title="Resultado" colorTitle='black' my={1} value={<Label color={statusColor[calibration?.status]}>{statusLabel[calibration?.status]}</Label>} />
          }

          {calibration?.instrumento?.criterioDeAceitacao && <ContentRow title="Critério de aceitação" value={`${Number(calibration?.instrumento?.criterioDeAceitacao).toFixed()} ${calibration?.instrumento?.unidade}`} />}
          {calibration?.instrumento?.observacaoCriterioAceitacao && <ContentRow title="Observação Critério de aceitação" value={calibration?.instrumento?.observacaoCriterioAceitacao} />}
          {calibration?.instrumento?.referenciaDoCriterio && <ContentRow title="Referência do Critério de aceitação" value={calibration?.instrumento?.referenciaDoCriterio} />}


          {!!calibration?.laboratorio && (
            <ContentRow title="Laboratório" value={calibration.laboratorio} />
          )}
          {!!calibration?.preco && (
            <ContentRow title="Preço" value={`R$ ${calibration.preco}`} />
          )}
          {!!calibration?.observacaoFornecedor && (
            <ContentRow title="Observação" value={calibration.observacaoFornecedor} />
          )}

          {!!calibration?.resultados?.length && (
            <>
              <ContentRow colorTitle='black' colorValue='black' title={calibration?.resultados[0].criterio?.tipo}  value={<Label color={calibration?.resultados[0].status === 'A' ? 'success' : 'warning'} >{calibration?.resultados[0].status === 'A' ? 'Aprovado' : 'Reprovado'}</Label>} />
              <ContentRow title="Maior erro" value={calibration?.resultados[0].maiorErro ? calibration?.resultados[0].maiorErro : "Não faz parte do cálculo"} />
              {!checagem && <ContentRow title="Incerteza" value={calibration?.resultados[0].incerteza ? calibration?.resultados[0].incerteza : "Não faz parte do cálculo"} />}
            </>
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
          </Box>
          {!!calibration?.certificados?.length && <Divider orientation={"horizontal"} flexItem />}
          {!!calibration?.certificados?.length && (
            <Box
              width="100%"
              height="100%"
              gap={2}
              display="flex"
              flexDirection="column"
            >
              {isLoadingDeleteCertificate ? <CircularProgress /> : calibration?.certificados?.map((certificado, i) => (
                <Box key={certificado?.id + i} sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 2 }}>
                  {checagem ? (
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      {certificado?.arquivo && <ContentRow colorTitle='black' title={`Documento ${i + 1}:`} isMobile value={<Attachment url={certificado?.arquivo} content='Clique para abrir' />} />}
                      <IconButton size='small' onClick={() => deleteCertificate(certificado?.id)}>
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      {certificado?.arquivo && <ContentRow colorTitle='black' title="Certificado:" isMobile value={<Attachment url={certificado?.arquivo} content={certificado?.numero} />} />}
                      <IconButton size='small' onClick={() => deleteCertificate(certificado?.id)}>
                        <ClearIcon />
                      </IconButton>
                    </Box>
                )}
                  {(certificado?.anexos?.map(({ anexo, id }, index) => (
                    <ContentRow my={0} key={id + index} title={`Anexo ${index + 1}`} value={<Attachment url={anexo} content={<AttachmentIcon fontSize='small' />} />} />
                  )))}
                </Box>
              ))}
            </Box>
          )}
      </CardContent>
      {calibration?.analiseCritica === "P" && (
      <CardActions sx={{ display: "flex", justifyContent: calibration?.analiseCritica === "P" ? "flex-end" : "space-between", m: 1 }}>
        {isLoadingCriticalAnalisys 
          ? <CircularProgress />
          : (
            <Tooltip title={!hasEditPermission && NO_PERMISSION_ACTION}>
              <span>
                <Button disabled={!hasEditPermission} onClick={() => setOpen(true)}>Análise Crítica</Button>
              </span>
            </Tooltip>
          )
        }
        <CriticalAnalysisDialog
          data={{
            maiorErro: calibration?.maiorErro,
            incerteza: calibration?.incerteza,
            status: calibration?.status,
            criterioDeAceitacao: `${calibration?.instrumento?.criterioDeAceitacao} ${calibration?.instrumento?.unidade && calibration?.instrumento?.unidade}`,
            observacaoCriterioAceitacao: calibration?.instrumento?.observacaoCriterioAceitacao,
            referenciaDoCriterio: calibration?.instrumento?.referenciaDoCriterio
          }}
          open={open}
          handleClose={handleCloseCriticalAnalysis}
          handleConfirmationAnalysis={handleConfirmationAnalysis}
          analiseCliente={analiseCliente}
          setAnaliseCliete={setAnaliseCliete}
          handleChange={handleChange}
        />
      </CardActions>
    )}
    </Card>
  )
}

export default Calibration