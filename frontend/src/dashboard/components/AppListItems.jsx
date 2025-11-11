import PropTypes from 'prop-types';
import { 
  Box, 
  Stack, 
  Link, 
  Card, 
  Button, 
  Divider, 
  Typography, 
  CardHeader, 
  CardContent
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, Link as RouterLink } from 'react-router';
import { isExpired, fDate } from '../../utils/formatTime';
import Iconify from '../../components/Iconify';
import palette from '../../theme/palette';
import Label from '../../components/label';
import { findCriticalAnalysisStage, criticalAnalysisMonths } from '../../utils/documents';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';


AppListItems.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  list: PropTypes.array.isRequired,
};

export default function AppListItems({ title, subheader, list, document, admin, instrumentsCount = 0, ...other }) {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'md');
  return (
    <Card>
      <CardHeader title={title} subheader={subheader} action={!document && <Typography variant="caption"> {instrumentsCount} instrumentos cadastrados</Typography>} />
      <CardContent 
        sx={{
          '& .MuiTimelineItem-missingOppositeContent:before': {
            display: 'none',
          },
          py: 2,
          overflow: 'auto'
        }}
      >

        {list?.length ?
          <Stack spacing={2}>
            {list?.map((data) => (
              <ListItem key={data?.id} isDocument={document} admin={admin} data={data} />
            ))}
          </Stack>
        : <EmptyYet onClick={() => navigate(document ? '/admin/documentos' : '/dashboard/instrumentos')} showKaka={false} isDashboard content={document ? 'revisao' : 'instrumento'} isMobile={isMobile} /> }
      </CardContent>

      <Divider />
      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button size="small" color="inherit" onClick={() => navigate(document ? '/admin/documentos' : '/dashboard/instrumentos')} endIcon={<Iconify icon={'eva:arrow-ios-forward-fill'} />}>
          Ver todos
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

ListItem.propTypes = {
  list: PropTypes.shape({
    tag: PropTypes.string,
    fabricante: PropTypes.string,
    modelo: PropTypes.string,
    faixaNominalMax: PropTypes.string,
    faixaNominalMin: PropTypes.string,
    unidade: PropTypes.string,
    data: PropTypes.string,
    isExpired: PropTypes.bool,
  }),
};

const formatData = (data, isDocument, admin) => {
  if (isDocument) {
    return {
      title: `${data?.tipo === 'revalidar' ? 'Revalidação' : 'Revisão'}: ${data?.documento?.titulo}`,
      subtitle: data?.alteracao,
      url: `/${admin ? 'admin' : 'dashboard'}/documento/${data?.documento?.id}/${data?.id}`,
      ...data,
    }
  }

  return {
    title: `${data?.tag} - ${data?.descricao}`,
    subtitle: `${data?.fabricante ? data?.fabricante : 'Fabricante não informado'} | ${data?.modelo ? data?.modelo : 'Modelo não informado'} | ${data?.faixaNominalMin? data?.faixaNominalMin : 'Fai. nominal mínima não informado'} - ${data?.faixaNominalMax ? data?.faixaNominalMax : "Fai. nominal máxima não informada"} ${data?.unidade}`,
    url: `/dashboard/instrumentos/${data?.id}/${data?.setor}`,
    ...data,
  }
}


function ListItem({ data, isDocument, admin }) {
  const formattedData = formatData(data, isDocument, admin)
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1.5,
          flexShrink: 0,
          background: isDocument ? palette.secondary.lighter : palette[data.isExpired ? 'error' : 'success'].light,
          backgroundImage: isDocument
            ? `linear-gradient(135deg, ${alpha(
              palette.secondary.dark,
              0
            )} 0%, ${alpha(palette[data.isExpired ? 'error' : 'success'].dark, 0.24)} 100%)`
            : `linear-gradient(135deg, ${alpha(
              palette[data.isExpired ? 'error' : 'success'].dark,
              0
            )} 0%, ${alpha(palette[data.isExpired ? 'error' : 'success'].dark, 0.24)} 100%)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Iconify
          icon={isDocument ? 'mingcute:document-2-line' : data.isExpired ? 'ant-design:close-outlined' : 'ant-design:check-outlined'}
          color={isDocument ? palette.secondary.darker : palette[data.isExpired ? 'error' : 'success'].darker}
          width={24}
          height={24}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          width: '100%',
          flexDirection: { md: 'row', xs: 'column' },
          alignItems: { md: 'center', xs: 'flex-start' },
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Link component={RouterLink} to={formattedData?.url} color="inherit" variant="subtitle2" underline="hover" noWrap>
            {formattedData?.title}
          </Link>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {formattedData?.subtitle}
          </Typography>
          {isDocument && data?.cliente && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formattedData?.cliente?.empresa}
            </Typography>
          )}
        </Box>
        {isDocument && data?.documento?.analiseCritica ? (
          <Label color={findCriticalAnalysisStage(data?.documento?.analiseCritica)} sx={{ mr: 3 }}>
            <Typography variant="caption">
              Análise Crítica: <b style={{ color: findCriticalAnalysisStage(data?.documento?.analiseCritica) }}>{criticalAnalysisMonths(data?.documento?.analiseCritica)}</b>
            </Typography>
          </Label>)
          : !!formatData?.data && (
            <Label color={isExpired ? 'error' : 'success'} sx={{ mr: 3 }}>
              <Typography variant="caption">
                {isExpired ? "Data última calibração " : "Data próxima calibração "}{fDate(data?.data, "dd/MM/yy")}
              </Typography>
            </Label>
          )}
      </Box>
    </Stack>
  );
}
