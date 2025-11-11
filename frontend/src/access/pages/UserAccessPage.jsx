import { Container, Grid, Typography } from '@mui/material'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import InviteGenerator from '../components/InviteGenerator';
import InviteList from '../components/InviteList';

function UserAccessPage() {
  return (
    <>
      <Helmet>
        <title> Acessos | Kometro </title>
      </Helmet>

      <Container>
        <Typography variant="h4" gutterBottom>
          Criar acessos
        </Typography>
        <Grid container spacing={4} mt={2}>
          <Grid item xs={12} md={6}>
            <InviteGenerator />
          </Grid>
          <Grid item xs={12} md={6}>
            <InviteList />
          </Grid>
        </Grid>

      </Container>
    </>
  )
}

export default UserAccessPage