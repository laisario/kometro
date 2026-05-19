import { Container, Grid, Typography } from '@mui/material'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import InviteGenerator from '../components/InviteGenerator';
import InviteList from '../components/InviteList';
import UserList from '../components/UserList';
import useUsers from '../hooks/useUsers';
import useAuth from '../../auth/hooks/useAuth';

function UserAccessPage() {
  const { user } = useAuth();
  const isAdmin = user?.admin;
  const clienteId = user?.cliente;
  
  const {
    users,
    isFetching: isFetchingUsers,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setPage,
  } = useUsers(clienteId, isAdmin);

  return (
    <>
      <Helmet>
        <title> Acessos | Kometro </title>
      </Helmet>

      <Container>
        <Typography variant="h4" gutterBottom>
          Gerenciar acessos
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Gerencie os convites de acesso e os usuários que têm acesso à sua empresa.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <InviteGenerator />
          </Grid>

          <Grid item xs={12} md={6}>
            <InviteList />
          </Grid>

          <Grid item xs={12}>
            <UserList 
              users={users}
              isFetching={isFetchingUsers}
              currentUser={user}
              clienteId={clienteId}
              isAdmin={isAdmin}
              page={page}
              rowsPerPage={rowsPerPage}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              setPage={setPage}
            />
          </Grid>
        </Grid>

      </Container>
    </>
  )
}

export default UserAccessPage
