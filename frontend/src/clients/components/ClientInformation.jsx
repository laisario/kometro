// import React from 'react'
// import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
// import ApartmentIcon from '@mui/icons-material/Apartment';
// import LocationCityIcon from '@mui/icons-material/LocationCity';
// import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
// import PhoneIcon from '@mui/icons-material/Phone';
// import BadgeIcon from '@mui/icons-material/Badge';
// import HomeIcon from '@mui/icons-material/Home';
// import EmailIcon from '@mui/icons-material/Email';

// const Information = ({ icon, value }) => (
//   <Stack alignItems="center" direction="row" gap={1}>
//     {icon}
//     <Typography 
//       sx={{
//         whiteSpace: 'normal',
//         wordWrap: 'break-word',
//       }}
//       variant='body1'
//       fontWeight="500" 
//       width="100%"
//     >
//       {value}
//     </Typography>
//   </Stack>
// )


// function ClientInformation({ data, isMobile }) {
//   return (
//     <Paper sx={{ padding: 4, gap:2, display: "flex", justifyContent: "space-around", flexDirection: isMobile ? 'column' : 'row' }}>
//       <Box>
//         {!!data?.empresa?.cnpj && <Information value={data?.empresa?.cnpj} icon={<ApartmentIcon fontSize='small' />} />}
//         {!data?.empresa?.isento && !!data?.empresa?.ie && (<Information value={data?.empresa?.ie} icon={<strong>IE</strong>} />)}
//         {!!data?.usuario?.username && <Information value={data?.usuario?.username} icon={<EmailIcon fontSize='small' />} />}
//         {!!data?.telefone && <Information value={data?.telefone} icon={<PhoneIcon fontSize='small' />} />}
//       </Box>

//       {!isMobile && <Divider orientation="vertical" flexItem />}

//       <Box>
//         {!!data?.empresa?.filial && <Information value={data?.empresa?.filial} icon={<LocationCityIcon fontSize='small' />} />}
//         {!!data?.empresa?.nomeFantasia && <Information value={data?.empresa?.nomeFantasia} icon={<DriveFileRenameOutlineIcon fontSize='small' />} />}
//         {!!data?.cpf && (
//             <Information icon={<BadgeIcon fontSize='small' />} value={data?.cpf} />
//         )}
//         {!!data?.endereco?.logradouro && (<Information value={`${data?.endereco?.logradouro}, ${data?.endereco?.numero} - ${data?.endereco?.bairro?.nome}, ${data?.endereco?.bairro?.cidade?.nome} - ${data?.endereco?.bairro?.cidade?.uf?.sigla}`} icon={<HomeIcon fontSize='small' />} />)}
//       </Box>
//     </Paper>
//   )
// }

// export default ClientInformation

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Box,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupIcon from "@mui/icons-material/Group";
import { permissionLabel } from "../../utils/permission";


const ClientInformation = ({ data, isMobile }) => {
  const empresa = data?.empresa;
  const endereco = data?.endereco;
  const usuarios = data?.usuarios ?? [];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'flex-start',
        gap: 2
      }}
    >
      {/* Empresa Card (with address) */}
      <Card 
        variant="outlined" 
        sx={{ 
          width: isMobile ? '100%' : 'auto',
          minWidth: isMobile ? 'auto' : '280px',
          flex: isMobile ? 'none' : 1,
          height: '240px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader
          avatar={<BusinessIcon color="primary" />}
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              Empresa
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ flex: 1, pt: 0 }}>
          <Stack spacing={1}>
            {empresa?.razaoSocial && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                <strong>Razão Social:</strong> {empresa?.razaoSocial}
              </Typography>
            )}
            {empresa?.cnpj && (
              <Typography variant="body2">
                <strong>CNPJ:</strong> {empresa?.cnpj}
              </Typography>
            )}
            {empresa?.nomeFantasia && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                <strong>Nome fantasia:</strong> {empresa?.nomeFantasia}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Filial:</strong> {empresa?.filial ?? "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Inscrição Estadual:</strong>{" "}
              {empresa?.isento ? "Isento" : empresa?.ie || "Não informado"}
            </Typography>
            {endereco?.enderecoCompleto && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                  <strong>Endereço:</strong> {endereco?.enderecoCompleto}
                </Typography>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Estatísticas Card */}
      <Card 
        variant="outlined" 
        sx={{ 
          width: isMobile ? '100%' : 'auto',
          minWidth: isMobile ? 'auto' : '240px',
          flex: isMobile ? 'none' : 1,
          height: '240px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader
          avatar={<BarChartIcon color="secondary" />}
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              Estatísticas
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ flex: 1, pt: 0 }}>
          <Stack spacing={1.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="error" fontWeight={600}>
                Vencidos
              </Typography>
              <Typography variant="h6" color="error">
                {data?.instrumentosVencidos ?? 0}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="success.main" fontWeight={600}>
                Em dia
              </Typography>
              <Typography variant="h6" color="success.main">
                {data?.instrumentosEmDia ?? 0}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="primary.main" fontWeight={600}>
                Cadastrados
              </Typography>
              <Typography variant="h6" color="primary.main">
                {data?.instrumentosCadastrados ?? 0}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="warning.main" fontWeight={600}>
                Propostas pendentes
              </Typography>
              <Typography variant="h6" color="warning.main">
                {data?.propostasAguardandoAprovacao ?? 0}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Usuários Card */}
      <Card 
        variant="outlined" 
        sx={{ 
          width: isMobile ? '100%' : 'auto',
          minWidth: isMobile ? 'auto' : '280px',
          flex: isMobile ? 'none' : 1,
          height: '240px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader
          avatar={<GroupIcon color="warning" />}
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              Usuários
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent 
          sx={{ 
            flex: 1, 
            pt: 0,
            overflowY: 'auto',
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
          }}
        >
          {!!usuarios?.length ? (
            <Stack spacing={1.5}>
              {usuarios?.map((u, idx) => (
                <Box key={idx}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {u?.firstName || "Usuário sem nome"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {u?.username ?? "—"}
                  </Typography>
                  <Box mt={0.5}>
                    {u?.groups?.length
                      ? u?.groups?.map((g) => (
                          <Chip
                            key={g.id}
                            label={permissionLabel[g.name] ?? "—"}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                      : (
                        <Chip
                          label="Sem grupo"
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      )}
                  </Box>
                  {idx < usuarios?.length - 1 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">Nenhum usuário cadastrado</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientInformation;