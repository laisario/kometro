import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import dayjs from 'dayjs';
import { capitalizeFirstLetter as CFL, titleCase } from '../../utils/formatString';
import { localLabels } from '../../utils/assets';

const ProposalDetailsPreview = ({ data, admin, isMobile }) => {
  const hasBillingInfo = data?.dataLiberouFaturamento || data?.usuarioLiberouFaturamento || data?.nfEntrada || data?.nf || data?.observacao || data?.realizado;

  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, flexWrap: 'wrap' }}>
      <Card elevation={2} sx={{ minWidth: isMobile ? '100%' : '300px', flex: isMobile ? 'none' : '1 1 300px' }}>
         <CardHeader 
           title={
             <Box display="flex" alignItems="center" gap={1}>
               <InfoIcon sx={{ color: '#1976d2' }} />
               <Typography variant="h6" color="black.secondary">
                 Informações Gerais
               </Typography>
             </Box>
           }
         />
        <CardContent>
          <Stack spacing={1.5}>
            {+(data?.totalComDesconto || data?.total) > 0 && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight="600" color="primary">
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  R$ {data?.totalComDesconto ? data?.totalComDesconto : data?.total}
                </Typography>
              </Box>
            )}
            
            {!!data?.dataCriacao && admin && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Proposta criada:
                </Typography>
                <Typography variant="body2">
                  {dayjs(data?.dataCriacao).locale('pt-BR').format('D [de] MMMM [de] YYYY')}
                </Typography>
              </Box>
            )}
            
            {!!data?.responsavel?.username && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Responsável:
                </Typography>
                <Typography variant="body2">
                  {titleCase(data?.responsavel?.username)}
                </Typography>
              </Box>
            )}
            
            {!!data?.local && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Local:
                </Typography>
                <Typography variant="body2">
                  {localLabels[data?.local]}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ minWidth: isMobile ? '100%' : '300px', flex: isMobile ? 'none' : '1 1 300px' }}>
         <CardHeader 
           title={
             <Box display="flex" alignItems="center" gap={1}>
               <PaymentIcon sx={{ color: '#2e7d32' }} />
               <Typography variant="h6" color="black">
                 Pagamento e Entrega
               </Typography>
             </Box>
           }
         />
        <CardContent>
          <Stack spacing={1.5}>
            {!!data?.condicaoDePagamento && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Condição:
                </Typography>
                <Typography variant="body2">
                  {data?.condicaoDePagamento}
                </Typography>
              </Box>
            )}
            
            {!!data?.prazoDePagamento && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Prazo:
                </Typography>
                <Typography variant="body2">
                  {dayjs(data?.prazoDePagamento).locale('pt-BR').format('D [de] MMMM [de] YYYY')}
                </Typography>
              </Box>
            )}
            
            {!!data?.diasUteis && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Entrega:
                </Typography>
                <Typography variant="body2">
                  {data?.diasUteis > 1 ? `Em ${data?.diasUteis} dias` : `Em ${data?.diasUteis} dia`}
                </Typography>
              </Box>
            )}
            
            {!!data?.transporte && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                  Transporte:
                </Typography>
                <Typography variant="body2">
                  {CFL(data?.transporte)}
                </Typography>
              </Box>
            )}
            
            {!!data?.enderecoDeEntrega && (
              <Box display="flex" alignItems="flex-start" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px', mt: 0.5 }}>
                  Endereço:
                </Typography>
                <Typography variant="body2">
                  {data?.enderecoDeEntrega?.logradouro}, {data?.enderecoDeEntrega?.numero}
                  {!!data?.enderecoDeEntrega?.complemento && ` - ${data?.enderecoDeEntrega?.complemento}`}
                  <br />
                  {data?.enderecoDeEntrega?.bairro?.nome} - {data?.enderecoDeEntrega?.cep}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {hasBillingInfo && (
        <Card elevation={2} sx={{ minWidth: isMobile ? '100%' : '300px', flex: isMobile ? 'none' : '1 1 300px' }}>
           <CardHeader 
             title={
               <Box display="flex" alignItems="center" gap={1}>
                 <ReceiptIcon sx={{ color: '#ed6c02' }} />
                 <Typography variant="h6">
                   Faturamento
                 </Typography>
               </Box>
             }
           />
          <CardContent>
            <Stack spacing={1.5}>
              {!!data?.dataLiberacaoFaturamento && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                    Data liberação:
                  </Typography>
                  <Typography variant="body2">
                    {dayjs(data?.dataLiberacaoFaturamento).locale('pt-BR').format('D [de] MMMM [de] YYYY')}
                  </Typography>
                </Box>
              )}
              
              {!!data?.usuarioLiberouFaturamento && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                    Usuário liberou:
                  </Typography>
                  <Typography variant="body2">
                    {titleCase(data?.usuarioLiberouFaturamento)}
                  </Typography>
                </Box>
              )}
              
              {!!data?.nfEntrada && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                    NF Entrada:
                  </Typography>
                  <Typography variant="body2">
                    {data?.nfEntrada}
                  </Typography>
                </Box>
              )}
              
              {!!data?.nf && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                    NF:
                  </Typography>
                  <Typography variant="body2">
                    {data?.nf}
                  </Typography>
                </Box>
              )}
              
              {!!data?.realizado && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                    Status:
                  </Typography>
                  <Chip 
                    label="Realizado" 
                    color="success" 
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}
              
              {!!data?.observacao && (
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px', mt: 0.5 }}>
                    Observação:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    backgroundColor: '#f5f5f5', 
                    p: 1, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
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
                  }}>
                    {data?.observacao}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default ProposalDetailsPreview