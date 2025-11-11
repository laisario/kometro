import React from 'react'
import { Helmet } from 'react-helmet-async';
import { Container, Grid, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router';
import ReviewCard from '../components/ReviewCard';
import useDocumentVM from '../viewModels/useDocumentVM';

function DocumentReviews() {
  const { id } = useParams();
  const {
    mutateApproveReview,
    isLoadingApproveReview,
    revisoes,
    document,
    user
  } = useDocumentVM(id);
  const titulo = document?.titulo
  return (
    <>
      <Helmet>
        <title>Histórico | Kometro</title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Histórico: {!!titulo && titulo}
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          {revisoes?.map((revisao) => (
            <Grid item key={revisao?.id} xs={12} sm={6}>
              <ReviewCard
                revisao={revisao} 
                key={revisao?.id} 
                user={user}
                mutateApproveReview={mutateApproveReview}
                isLoadingApproveReview={isLoadingApproveReview}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  )
}

export default DocumentReviews
