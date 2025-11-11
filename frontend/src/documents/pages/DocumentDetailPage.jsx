import { memo, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './styles.css'
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';
import Loading from '../../components/Loading'
import useDocumentVM from '../viewModels/useDocumentVM';
import FormCreateReview from '../components/FormCreateReview';
import InformationCard from '../components/InformationCard';
import ReviewCard from '../components/ReviewCard';
import DocViewer from '../components/DocViewer';

const StyledSwiper = styled(Swiper)`
  width: 100%;
  .swiper-button-next {
    color: #FD7622;
  };
  .swiper-button-prev {
    color: #FD7622;
  };
  .swiper-pagination-bullet-active {
    background: #FD7622;
  }
`;

export default function DocumentDetailPage() {
  const [swiper, setSwiper] = useState(null);
  const { id, idRevisao } = useParams();

  const {
    document,
    isLoadingDocument,
    status,
    statusColor,
    openFormReview,
    setOpenFormReview,
    mutateCreateReview,
    isCreatingReview,
    handleCloseReview,
    user,
    fileType,
    revisoes,
    navigate,
    formReview,
    error,
    setError,
    mutateApproveReview, 
    isLoadingApproveReview,
  } = useDocumentVM(id);
  useEffect(() => {
    if (idRevisao && swiper && !!revisoes?.length) {
      const ids = revisoes?.map(revisao => revisao?.id)
      const index = ids?.indexOf(Number(idRevisao))
      swiper.slideTo(index)
    }
  }, [idRevisao, swiper, revisoes])

  const admin = user?.admin ? 'admin' : 'dashboard'

  return (
    <>
      <Helmet>
        <title>Documento | Kometro</title>
      </Helmet>
      {isLoadingDocument
        ? <Loading /> 
        : (
            <Container>
              <Grid container spacing={4}>
                {!!document?.arquivo && (
                  <Grid style={{ height: 'auto' }} item xs={12}  md={8}>
                    <DocViewer
                      document={document}
                      fileType={fileType}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <InformationCard 
                    data={document} 
                    status={status} 
                    statusColor={statusColor} 
                    setOpenFormReview={setOpenFormReview} 
                    user={user} 
                    form={formReview}
                  />
                  {!!revisoes?.length &&
                    <Box>
                      <Box display="flex" flexDirection="row" justifyContent="space-between">
                        <Typography variant="h5" margin={2}>
                          Histórico
                        </Typography>
                        {revisoes?.length > 1 && (
                          <Button 
                            size='small' 
                            onClick={() => navigate(
                              `/${admin}/documento/${id}/revisoes`, 
                              { sate: { data: { user, titulo: document?.titulo } } }
                            )}
                          >
                            Ver tudo
                          </Button>
                        )}
                      </Box>
                      <StyledSwiper
                        modules={[Navigation, Pagination]}
                        navigation
                        pagination={
                          { dynamicBullets: true, }
                        }
                        spaceBetween={50}
                        slidesPerView={1}
                        onSlideChange={(swiper) => navigate(`/${admin}/documento/${id}/${revisoes[swiper?.activeIndex]?.id}`)}
                        onSwiper={(swiper) => setSwiper(swiper)}
                        >
                        {revisoes.map(revisao => (
                          <SwiperSlide key={revisao?.id}>
                            <ReviewCard
                              revisao={revisao} 
                              user={user}
                              mutateApproveReview={mutateApproveReview}
                              isLoadingApproveReview={isLoadingApproveReview}
                            />
                          </SwiperSlide>
                        ))}
                      </StyledSwiper>
                    </Box>
                  }
                </Grid>
              </Grid>
              <FormCreateReview
                idCreator={document?.criador?.id}
                open={openFormReview}
                mutateCreateReview={mutateCreateReview}
                isCreatingReview={isCreatingReview}
                form={formReview}
                handleClose={handleCloseReview}
                error={error}
                setError={setError}
              />
            </Container>
          )}
    </>
  )
}

