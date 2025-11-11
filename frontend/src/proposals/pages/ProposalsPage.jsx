import { Helmet } from 'react-helmet-async';
import {
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  Checkbox,
  Tooltip,
} from '@mui/material';
import Label from '../../components/label';
import { fDate } from '../../utils/formatTime';
import FormCreateProposal from '../components/FormCreateProposal';
import TableHeader from '../../components/TableHeader';
import TableToolbar from '../components/TableToolbar';
import EmptyYet from '../../components/EmptyYet';
import useProposalsVM from '../viewModels/useProposalsVM';
import Loading from '../../components/Loading';
import { headCells, headCellsAdmin, statusColor, statusString } from '../../utils/proposals';
import GetAppIcon from '@mui/icons-material/GetApp';
import CsvViewer from '../../components/CsvViewer';
import useAuth from '../../auth/hooks/useAuth';
import { NO_PERMISSION_ACTION } from '../../utils/messages';
import { useMemo } from 'react';

function ProposalsPage() {
  const {
    isSelected,
    handleClick,
    handleSelectAllClick,
    handleOpen,
    handleClose,
    navigate,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    formFilter,
    deleteOrder,
    isLoadingProposals,
    admin,
    isMobile,
    open,
    allProposals,
    selectedOrders,
    setSelectedOrders,
    mutateCreateProposal,
    isLoadingCreateProposal,
    formCreateProposal,
    clients,
    isLoadingClients,
    error,
    setError,
    exportOrders,
    csvContent,
    user,
  } = useProposalsVM()
  const isFiltering = formFilter?.formState?.isDirty
  const { hasCreatePermission } = useAuth()
  const hasProposals = useMemo(() => !!allProposals?.results?.length , [allProposals])
  return (
    <>
      <Helmet>
        <title> Propostas | Kometro </title>
      </Helmet>

      <Container>
        <Stack direction={isMobile ? 'column' : "row"} alignItems={isMobile ? "start " : "center"} justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            {admin ? 'Propostas' : 'Minhas propostas'}
          </Typography>

          <Stack  
            direction="row" 
            alignItems="center" 
            gap={2}
          >
            {admin && <Button
              variant="contained" 
              startIcon={<GetAppIcon />} 
              disabled={selectedOrders?.length < 1}
              onClick={exportOrders}
            >
              Exportar
            </Button>}
            
            <Tooltip title={!hasCreatePermission && NO_PERMISSION_ACTION}>
              <span>
                <Button disabled={!hasCreatePermission} variant="contained" onClick={handleOpen} >
                  Nova proposta
                </Button>
              </span>
            </Tooltip>
          </Stack>

        </Stack>
        
        {isLoadingProposals
          ? <Loading />
          : (
            <Card>
              <TableToolbar
                form={formFilter} 
                numSelected={selectedOrders.length} 
                selectedOrders={selectedOrders} 
                setSelectedOrders={setSelectedOrders} 
                admin={admin} 
                deleteOrder={deleteOrder}
                isMobile={isMobile}
                />
                {!hasProposals
                  ? <EmptyYet table content="proposta" isFiltering={isFiltering} onClick={handleOpen} isMobile={isMobile} />  
                  : (<>
                      <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                          <TableHeader
                            numSelected={selectedOrders?.length}
                            onSelectAllClick={handleSelectAllClick}
                            rowCount={allProposals?.results?.length}
                            checkbox={admin}
                            headCells={admin ? headCellsAdmin : headCells}
                          />
                          <TableBody sx={{ overflowX: 'auto' }}>
                            {allProposals?.results?.map((row, index) => {
                              const { id, dataCriacao, status, cliente, numero, total } = row;
                              const isItemSelected = isSelected(row.id);
                              return (
                                <TableRow
                                  hover
                                  key={id}
                                  tabIndex={-1}
                                  onClick={() => { 
                                    navigate(
                                      admin 
                                      ? `/admin/proposta/${id}/${cliente?.id}` 
                                      : `/dashboard/proposta/${id}`
                                    )}}
                                    >
                                  {admin &&
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        color="primary"
                                        onClick={(event) => handleClick(event, row.id)}
                                        checked={isItemSelected}
                                        inputProps={{
                                          'aria-labelledby': index,
                                        }}
                                      />
                                    </TableCell>
                                  }
                                  <TableCell align="left">{numero}</TableCell>

                                  <TableCell align="left">{fDate(dataCriacao)}</TableCell>
                                  {admin 
                                    ? (
                                      <TableCell align="left">
                                      {cliente?.empresa?.razaoSocial || cliente?.nome}
                                    </TableCell>) 
                                    : (
                                      <TableCell align="left">
                                      {+total > 0 ? `R$ ${total}` : "Aguardando resposta"}
                                    </TableCell>)}

                                  <TableCell align="left">
                                    <Label color={statusColor[status]}>{statusString[status]}</Label>
                                  </TableCell>
                                </TableRow>
                              )})}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 100]}
                        component="div"
                        count={allProposals?.count || 0}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Linhas por páginas"
                      />
                    </>
                  )
                }
              </Card>
            )
          }

        <FormCreateProposal 
          open={open} 
          onClose={handleClose} 
          user={user} 
          mutateCreateProposal={mutateCreateProposal}
          isLoadingCreateProposal={isLoadingCreateProposal}
          formCreateProposal={formCreateProposal}
          clients={clients}
          isLoadingClients={isLoadingClients}
          error={error}
          setError={setError}
        />
      </Container>
       <CsvViewer csvContent={csvContent} fileName="propostas" />
    </>
  );
}

export default ProposalsPage