import PropTypes from 'prop-types';
import { 
  Box,
  Button, 
  Card, 
  Divider, 
  Typography, 
  CardHeader, 
  CardContent, 
  Link 
} from '@mui/material';
import { 
  Timeline, 
  TimelineDot, 
  TimelineItem, 
  TimelineContent, 
  TimelineSeparator, 
  TimelineConnector 
} from '@mui/lab';
import { 
  useLocation,
  useNavigate, 
  Link as RouterLink 
} from 'react-router';
import Iconify from '../../components/Iconify';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';

AppOrderTimeline.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  list: PropTypes.array,
};

export default function AppOrderTimeline({ title, subheader, list, ...other }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'md');
  
  
  const redirect = () => {
    if (pathname.includes('/admin')) {
      navigate('/admin/propostas');
    } else {
      navigate('/dashboard/propostas');
    }
  };
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      
      <CardContent
        sx={{
          '& .MuiTimelineItem-missingOppositeContent:before': {
            display: 'none',
          },
          py: 2,
        }}
      >
        {list?.length 
          ? (
            <Timeline sx={{ p: 0 }}>
              {list?.map((item, index) => (
                <OrderItem key={item?.id} item={item} isLast={index === list?.length - 1} />
              ))}
            </Timeline>
          ) 
          :  <EmptyYet onClick={redirect} isDashboard content="proposta" showKaka={false} isMobile={isMobile} />
        }
      </CardContent>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          onClick={redirect}
          endIcon={<Iconify icon={'eva:arrow-ios-forward-fill'} />}
          >
          Ver todos
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

OrderItem.propTypes = {
  isLast: PropTypes.bool,
  item: PropTypes.shape({
    time: PropTypes.string,
    title: PropTypes.string,
    status: PropTypes.string,
    url: PropTypes.string,
  }),
};

const statusColor = {
  "E": 'info',
  "AA": 'warning',
  "A": 'success',
  "R": 'error',
}

function OrderItem({ item, isLast }) {
  const { status, title, time, url, client } = item;
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot
          variant='filled'
          color={statusColor[status]}
        />
        {isLast ? null : <TimelineConnector />}
      </TimelineSeparator>

      <TimelineContent>
        <Link component={RouterLink} to={url} color="inherit" variant="subtitle2" underline="hover" noWrap>
          {title}
        </Link>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {client}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {time}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}
