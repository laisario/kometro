import React, { useMemo } from 'react'
import { 
  Checkbox, 
  TableRow, 
  TableBody, 
  TableCell, 
  Table, 
  TableContainer, 
  TablePagination, 
  Paper,
  Card
} from '@mui/material';
import TableToolbar from './TableToolbar';
import TableHeader from '../../components/TableHeader';
import { criticalAnalysisMonths, findCriticalAnalysisStage, headCells, status, statusColor } from '../../utils/documents';
import titleCase from '../../utils/formatTitle';
import Label from '../../components/label'
import { fDate } from '../../utils/formatTime';
import EmptyYet from '../../components/EmptyYet';

function TableDocuments(props) {
  const {
    selectedDocuments,
    isDeleting,
    formFilter,
    isLoading,
    filter,
    setFilter,
    handleSelectAllClick,
    data,
    deleteDocumentos,
    rowsPerPage,
    page,
    handleChangePage,
    handleChangeRowsPerPage,
    isSelected,
    handleClick,
    navigate,
    cleanSelectedDocuments,
    isMobile,
    user,
  } = props;

  const handleDelete = () => {
    deleteDocumentos(selectedDocuments); 
    cleanSelectedDocuments();
  }
  const isFiltering = formFilter?.formState?.isDirty
  const admin = user?.admin ? 'admin' : 'dashboard'
  const hasDocuments = useMemo(() => !!data?.results?.length, [data] )

  return (
    <Card>
      <TableToolbar
        numSelected={selectedDocuments?.length}
        deleteDocuments={handleDelete}
        isDeleting={isDeleting}
        form={formFilter}
        isLoading={isLoading}
        filter={filter}
        setFilter={setFilter}
      />
      {!hasDocuments
        ? <EmptyYet table content="documento" isMobile={isMobile} isFiltering={isFiltering} /> 
        : (
            <>
              <TableContainer >
                <Table
                  sx={{ minWidth: 800 }}
                  aria-labelledby="tabelaDocumentos" 
                >
                  <TableHeader
                    numSelected={selectedDocuments?.length}
                    onSelectAllClick={handleSelectAllClick}
                    rowCount={data?.results?.length}
                    admin={user?.admin}
                    checkbox
                    headCells={headCells}
                  />
                  <TableBody sx={{ overflowX: 'auto' }}>
                    {data?.results?.map((row, index) => {
                      const isItemSelected = isSelected(row?.id);
                      return (
                        <TableRow
                        hover
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.id}
                        onClick={() => { navigate(`/${admin}/documento/${row?.id}/${row?.revisoes[0]?.id || 0}`) }}
                          sx={{ cursor: 'pointer' }}
                          >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              onClick={(event) => handleClick(event, row?.id)}
                              checked={isItemSelected}
                              inputProps={{
                                'aria-labelledby': index,
                              }}
                              />
                          </TableCell>
                          <TableCell
                            component="th"
                            id={index}
                            scope="row"
                            padding="none"
                            >
                            {row?.codigo?.codigo?.toUpperCase()}
                          </TableCell>
                          <TableCell>{!!row?.titulo && titleCase(row?.titulo)}</TableCell>
                          <TableCell>
                            <Label color={statusColor[row?.status]}>
                              {status[row?.status]}
                            </Label>
                          </TableCell>
                          <TableCell>{!!row?.criador?.username && row?.criador?.username}</TableCell>
                          <TableCell> {!!row?.dataValidade && fDate(row?.dataValidade)}</TableCell>
                          <TableCell>
                            {!!row?.analiseCritica && (
                              <Label color={findCriticalAnalysisStage(row?.analiseCritica)}>
                                {criticalAnalysisMonths(row?.analiseCritica)}
                              </Label>
                            )}
                          </TableCell>
                        </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={data?.count || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Linhas por páginas"
              />
          </>
    )}
    </Card>
  )
}

export default TableDocuments