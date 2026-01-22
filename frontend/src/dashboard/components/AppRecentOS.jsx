import PropTypes from 'prop-types';
import { 
  Box,
  Button, 
  Card, 
  Divider, 
  Typography, 
  CardHeader, 
  CardContent,
  CircularProgress,
} from '@mui/material';
import { 
  useNavigate, 
  Link as RouterLink 
} from 'react-router';
import Iconify from '../../components/Iconify';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';

AppRecentOS.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  list: PropTypes.array,
  isLoading: PropTypes.bool,
};

export default function AppRecentOS({ title, subheader, list, isLoading, ...other }) {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'md');
  
  const redirect = () => {
    navigate('/eu');
  };

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      
      <CardContent
        sx={{
          py: 2,
        }}
      >
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : list?.length ? (
          <Box>
            {list?.map((os, index) => (
              <OSItem 
                key={os?.id} 
                os={os} 
                isLast={index === list?.length - 1} 
              />
            ))}
          </Box>
        ) : (
          <EmptyYet 
            onClick={redirect} 
            isDashboard 
            content="os" 
            showKaka={false} 
            isMobile={isMobile} 
          />
        )}
      </CardContent>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          onClick={redirect}
          endIcon={<Iconify icon={'eva:arrow-ios-forward-fill'} />}
        >
          Ver todas
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

OSItem.propTypes = {
  isLast: PropTypes.bool,
  os: PropTypes.shape({
    id: PropTypes.number,
    numero: PropTypes.string,
    clienteNome: PropTypes.string,
    propostaNumero: PropTypes.string,
    instrumentosCount: PropTypes.number,
    dataCriacao: PropTypes.string,
  }),
};

function OSItem({ os, isLast }) {
  const { numero, clienteNome, propostaNumero, instrumentosCount, dataCriacao } = os;
  
  return (
    <Box
      sx={{
        py: 1.5,
        borderBottom: isLast ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="subtitle2" noWrap>
        {numero || 'N/A'}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {clienteNome || propostaNumero || 'N/A'}
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {instrumentosCount || 0} instrumento(s)
        </Typography>
        {dataCriacao && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {fDate(dataCriacao, 'dd/MM/yyyy')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
