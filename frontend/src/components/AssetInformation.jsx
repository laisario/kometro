import { Box, Typography, Chip, } from '@mui/material'
import React from 'react'
import ContentRow from './ContentRowCard'
import { positionLabels, colorPositionInstrument, tipoServicoMap } from '../utils/assets';
import { fDate } from '../utils/formatTime';
import Label from './label';


function AssetInformation({instrument, isMobile}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        wrap: 'wrap',
        gap: 2,
        alignItems: 'flex-start'
      }}
    >
      <Box sx={{ minWidth: isMobile ? "100%" : "33%", flex: 1 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom color="primary">
          Identificação
        </Typography>
        {!!instrument?.tag && (
          <ContentRow title="Tag" value={instrument?.tag} />
        )}
        {!!instrument?.numeroDeSerie && (
          <ContentRow title="Série" value={instrument?.numeroDeSerie} />
        )}
        {!!instrument?.classe && (
          <ContentRow title="Classe" value={instrument?.classe} />
        )}
        {!!instrument?.posicao && (
          <ContentRow title="Posição" value={<Label color={colorPositionInstrument[instrument?.posicao]}>{positionLabels[instrument?.posicao]}</Label>} />
        )}
        {!!instrument?.setor && (
          <ContentRow title="Setor" value={instrument?.setor?.caminhoHierarquia} />
        )}
        
        <Typography variant="body2" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
          Instrumento Base
        </Typography>
        {!!instrument?.instrumento?.tipoDeInstrumento?.descricao && (
          <ContentRow title="Descrição" value={instrument?.instrumento?.tipoDeInstrumento?.descricao} />
        )}
        {!!instrument?.instrumento?.tipoDeInstrumento?.modelo && (
          <ContentRow title="Modelo" value={instrument?.instrumento?.tipoDeInstrumento?.modelo} />
        )}
        {!!instrument?.instrumento?.tipoDeInstrumento?.fabricante && (
          <ContentRow title="Fabricante" value={instrument?.instrumento?.tipoDeInstrumento?.fabricante} />
        )}
        {!!instrument?.instrumento?.tipoDeInstrumento?.resolucao && (
          <ContentRow title="Resolução" value={instrument?.instrumento?.tipoDeInstrumento?.resolucao} />
        )}
        {!!instrument?.instrumento?.capacidadeDeMedicao?.valor && (
          <ContentRow
            title="Capacidade" 
            value={`${instrument?.instrumento?.capacidadeDeMedicao?.valor} ${instrument?.instrumento?.capacidadeDeMedicao?.unidade || ''}`}
          />
        )}
        {!!instrument?.instrumento?.maximo && (
          <ContentRow title="Faixa" value={`${instrument?.instrumento?.minimo || 0} - ${instrument?.instrumento?.maximo} ${instrument?.instrumento?.unidade || ''}`} />
        )}
        {!!instrument?.instrumento?.tipoDeServico && (
          <ContentRow title="Serviço" value={<Label color="secondary">{tipoServicoMap[instrument?.instrumento?.tipoDeServico]}</Label>} />
        )}
        
        {(!!instrument?.criterioFrequencia || !!instrument?.frequenciaChecagem?.quantidade || !!instrument?.frequenciaCalibracao?.quantidade) && <Typography variant="body2" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
          Frequências
        </Typography>}
        {!!instrument?.criterioFrequencia && (
          <ContentRow 
            title="Critério" 
            value={instrument?.criterioFrequencia === "C" ? "Calendário" : "Serviço"} 
          />
        )}
        {!!instrument?.frequenciaChecagem?.quantidade && (
          <ContentRow 
            title="Checagem" 
            value={`${instrument?.frequenciaChecagem?.quantidade} ${instrument?.frequenciaChecagem?.periodo === 'dia' ? 'dias' : instrument?.frequenciaChecagem?.periodo === 'mes' ? 'meses' : 'anos'}`} 
          />
        )}
        {!!instrument?.frequenciaCalibracao?.quantidade && (
          <ContentRow 
            title="Calibração" 
            value={`${instrument?.frequenciaCalibracao?.quantidade} ${instrument?.frequenciaCalibracao?.periodo === 'dia' ? 'dias' : instrument?.frequenciaCalibracao?.periodo === 'mes' ? 'meses' : 'anos'}`} 
          />
        )}
      </Box>

      <Box sx={{ minWidth: isMobile ? "100%" : "33%", flex: 1 }}>
        {(!!instrument?.dataCriacao || !!instrument?.dataProximaCalibracao || !!instrument?.dataUltimaCalibracao || !!instrument?.dataProximaChecagem || !!instrument?.dataUltimaChecagem) && <Typography variant="body2" fontWeight="bold" gutterBottom color="primary">
          Datas
        </Typography>}
        {!!instrument?.dataCriacao && (
          <ContentRow title="Criado em" value={fDate(instrument?.dataCriacao, "dd/MM/yyyy")} />
        )}
        {!!instrument?.dataProximaCalibracao && (
          <ContentRow title="Próxima Calibração" value={fDate(instrument?.dataProximaCalibracao, "dd/MM/yyyy")} />
        )}
        {!!instrument?.dataUltimaCalibracao && (
          <ContentRow title="Última Calibração" value={fDate(instrument?.dataUltimaCalibracao, "dd/MM/yyyy")} />
        )}
        {!!instrument?.dataProximaChecagem && (
          <ContentRow title="Próxima Checagem" value={fDate(instrument?.dataProximaChecagem, "dd/MM/yyyy")} />
        )}
        {!!instrument?.dataUltimaChecagem && (
          <ContentRow title="Última Checagem" value={fDate(instrument?.dataUltimaChecagem, "dd/MM/yyyy")} />
        )}
        
        {(!!instrument?.instrumento?.precoCalibracaoNoCliente || !!instrument?.instrumento?.precoCalibracaoNoLaboratorio || !!instrument?.precoAlternativoCalibracao) && (
          <Typography variant="body2" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
          Preços
        </Typography>)}
        {!!instrument?.instrumento?.precoCalibracaoNoCliente && (
          <ContentRow title="Cliente" value={`R$ ${instrument?.instrumento?.precoCalibracaoNoCliente}`} />
        )}
        {!!instrument?.instrumento?.precoCalibracaoNoLaboratorio && (
          <ContentRow title="Laboratório" value={`R$ ${instrument?.instrumento?.precoCalibracaoNoLaboratorio}`} />
        )}
        {!!instrument?.precoAlternativoCalibracao && (
          <ContentRow title="Alternativo" value={`R$ ${instrument?.precoAlternativoCalibracao}`} />
        )}

        {(!!instrument?.pontosDeCalibracao?.length || !!instrument?.normativos?.length) && <Typography variant="body2" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 1 }}>
          Pontos & Normativos
        </Typography>}
        {!!instrument?.pontosDeCalibracao?.length && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Pontos:</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {instrument?.pontosDeCalibracao?.map((ponto, index) => (
                <Chip 
                  key={index}
                  label={ponto?.nome} 
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
        {!!instrument?.normativos?.length && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Normativos:</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {instrument?.normativos?.map((normativo, index) => (
                <Chip 
                  key={index}
                  label={normativo?.nome} 
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ minWidth: isMobile ? "100%" : "33%", flex: 1 }}>
        {!!instrument?.expirado && <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight="bold" color="primary" >
            Status
          </Typography>
          <Chip 
            color={instrument?.expirado ? "error" : "success"} 
            size="small"
            label={instrument?.expirado ? "Expirado" : "Válido"} 
          />
        </Box>}
         {!!instrument?.criteriosAceitacao?.length && (
           <Box>
             <Typography variant="body2" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
               Critérios de Aceitação
             </Typography>
             <Box 
               sx={{ 
                 maxHeight: '250px', 
                 overflowY: 'auto',
                 pr: 1,
                 '&::-webkit-scrollbar': {
                   width: '4px',
                 },
                 '&::-webkit-scrollbar-track': {
                   background: '#f1f1f1',
                   borderRadius: '4px',
                 },
                 '&::-webkit-scrollbar-thumb': {
                   background: '#c1c1c1',
                   borderRadius: '4px',
                 },
                 '&::-webkit-scrollbar-thumb:hover': {
                   background: '#a8a8a8',
                 },
               }}
             >
               {instrument?.criteriosAceitacao?.map((criterio, index) => (
                 <Box key={index} sx={{ p: 1.5, mb: 1, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                   <Box>
                     <ContentRow title="Tipo" value={criterio?.tipo} />
                     <ContentRow title="Critério" value={`${criterio?.criterioDeAceitacao} ${criterio?.unidade || ''}`} />
                     {!!criterio?.referenciaDoCriterio && (
                       <ContentRow title="Referência" value={criterio?.referenciaDoCriterio} />
                     )}
                     {!!criterio?.observacaoCriterioAceitacao && (
                       <ContentRow title="Obs" value={criterio?.observacaoCriterioAceitacao} />
                     )}
                   </Box>
                 </Box>
               ))}
             </Box>
           </Box>
         )}
        {!!instrument?.observacao && (
          <Box>
            <Typography variant="body2" fontWeight="bold" gutterBottom color="primary">
              Observação
            </Typography>
            <Box sx={{ p: 1, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant='body2' color="text.secondary">
                {instrument?.observacao}
              </Typography>
            </Box>
          </Box>
        )}

      </Box>

    </Box>
  )
}

export default AssetInformation