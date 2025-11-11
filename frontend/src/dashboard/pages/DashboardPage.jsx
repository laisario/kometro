import { Helmet } from 'react-helmet-async';
import { Grid, Container, CircularProgress, Button } from '@mui/material';
import { 
  AppOrderTimeline, 
  AppWidgetSummary, 
  AppListItems
 } from '../components';
import { fDate } from '../../utils/formatTime';
import { useDashboardVM } from '../viewModels/useDashboardVM';
import { Link } from 'react-router';


export default function DashboardPage() {
  const {
    data,
    instruments,
    user,
    documents,
    mutateUpdateStats, 
    isLoadingUpdateStats
  } = useDashboardVM()

  return (
    <>
      <Helmet>
        <title>Kometro</title>
      </Helmet>

      <Container maxWidth="xl">
        {!data ? (
          <Grid container item height="70vh" justifyContent="center" alignItems="center" spacing={3}>
            <CircularProgress size="96px" />
          </Grid>
        ) : (
          <Grid container spacing={3}>
            <Grid item display="flex" justifyContent="flex-end" alignItems="flex-end" xs={12} sm={12} md={12}>
              <Button variant="outlined" size='small' color="primary" onClick={mutateUpdateStats} disabled={isLoadingUpdateStats}>
                {isLoadingUpdateStats ? <CircularProgress size="20px" color="inherit" /> : 'Atualizar Estatísticas'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AppWidgetSummary
                title="Instrumentos vencidos"
                color="error"
                total={data?.instrumentosVencidos || 0}
                icon="ant-design:close-outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <AppWidgetSummary
                title="Instrumentos calibrados em dia"
                color="success"
                total={data?.instrumentosEmDia || 0}
                icon={'ant-design:check-outlined'}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Link to="/dashboard/documentos?vencido=True" style={{ textDecoration: 'none' }}>
                <AppWidgetSummary
                  title="Documentos vencidos"
                  total={data?.documentosVencidos || 0}
                  color="info"
                  icon={'mdi:file-document-alert-outline'}
                />
              </Link>
            </Grid>

            {user?.admin ? (
              <Grid item xs={12} sm={6} md={3}>
                <Link to="/admin/propostas?status=E" style={{ textDecoration: 'none' }}>
                  <AppWidgetSummary
                    title="Propostas em elaboração"
                    total={data?.propostasEmElaboracao || 0}
                    color="warning"
                    icon={'ant-design:file-sync-outlined'}
                  />
                </Link>
              </Grid>
            ) : (
              <Grid item xs={12} sm={6} md={3}>
                <Link to="/dashboard/propostas?status=AA" style={{ textDecoration: 'none' }}>
                  <AppWidgetSummary
                    title="Propostas aguardando aprovação"
                    total={data?.propostasAguardandoAprovacao || 0}
                    color="warning"
                    icon={'ant-design:file-sync-outlined'}
                  />
                </Link>
              </Grid>
            )}


            <Grid item xs={12} md={7} lg={8}>
              <AppListItems
                title="Aprovações pendentes"
                list={documents}
                document
                admin={user?.admin}
              />
            </Grid>

            <Grid item xs={12} md={5} lg={4}>
              <AppOrderTimeline
                title="Propostas recentes"
                list={data?.ultimasPropostas?.map((proposta) => ({
                  id: proposta?.id,
                  title: `Proposta ${proposta?.numero}`,
                  status: proposta?.status,
                  time: fDate(proposta?.dataCriacao),
                  url: user?.admin ? `/admin/proposta/${proposta?.id}/${proposta?.cliente?.id}` : `/dashboard/proposta/${proposta?.id}`,
                  client: proposta?.cliente?.empresa,
                }))}
              />
            </Grid>

            {!user?.admin && <Grid item xs={12} md={7} lg={8}>
              <AppListItems
                title="Instrumentos recentes"
                list={instruments}
                admin={user?.admin}
                instrumentsCount={data?.instrumentosCadastrados || 0}
              />
            </Grid>}
          </Grid>
        )}
      </Container>
    </>
  );
}
