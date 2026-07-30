import {
  Box,
  Button,
  Card,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';

import Loading from '../../components/Loading';
import useFileAccessRequests from '../hooks/useFileAccessRequests';

const formatDate = (value) => {
  if (!value) return '—';

  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatTime = (value) => value?.slice(0, 5) || '—';

const requestedFileName = (request) => (
  request?.arquivo?.titulo
  || request?.arquivo?.nomeOriginal
  || `Arquivo #${request?.arquivo?.id}`
);

export default function FileAccessRequestsPage() {
  const {
    requests,
    error,
    isFetching,
    refetch,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useFileAccessRequests();

  const rows = requests?.results || [];

  if (isFetching && !rows.length) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          minHeight="400px"
        >
          <Typography variant="h6" color="error">
            Não foi possível carregar as solicitações de arquivos.
          </Typography>
          <Button variant="contained" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> Solicitações de arquivos | Kometro </title>
      </Helmet>

      <Container>
        <Box mb={3}>
          <Typography variant="h4" gutterBottom>
            Solicitações de arquivos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consulte os dados enviados para acessar os arquivos dos posts.
          </Typography>
        </Box>

        <Card>
          <TableContainer sx={{ minWidth: 900 }}>
            <Table aria-label="Solicitações de acesso a arquivos">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Arquivo solicitado</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Hora</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length ? (
                  rows.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>{request.nome || '—'}</TableCell>
                      <TableCell>{request.empresa || '—'}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        {request.email || '—'}
                      </TableCell>
                      <TableCell>{request.telefone || '—'}</TableCell>
                      <TableCell>{requestedFileName(request)}</TableCell>
                      <TableCell>{formatDate(request.dataSolicitacao)}</TableCell>
                      <TableCell>{formatTime(request.horaSolicitacao)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        Nenhuma solicitação de arquivo encontrada.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={requests?.count || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página"
          />
        </Card>
      </Container>
    </>
  );
}
