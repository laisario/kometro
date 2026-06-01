import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router';
import EmptyYet from '../../components/EmptyYet';
import Iconify from '../../components/Iconify';
import Label from '../../components/label';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';

AppRejectedCalibrations.propTypes = {
  list: PropTypes.array,
  title: PropTypes.string,
};

export default function AppRejectedCalibrations({ title, list = [] }) {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'md');

  return (
    <Card>
      <CardHeader title={title} subheader="Últimas 5 calibrações com resultado reprovado" />
      <CardContent sx={{ py: 2, overflow: 'auto' }}>
        {list?.length ? (
          <Stack spacing={2}>
            {list.map((calibration) => (
              <RejectedCalibrationItem key={calibration.id} calibration={calibration} />
            ))}
          </Stack>
        ) : (
          <EmptyYet
            onClick={() => navigate('/dashboard/instrumentos?tab=table')}
            showKaka={false}
            isDashboard
            content="calibracao"
            isMobile={isMobile}
          />
        )}
      </CardContent>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          onClick={() => navigate('/dashboard/instrumentos?tab=table')}
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
        >
          Ver instrumentos
        </Button>
      </Box>
    </Card>
  );
}

function RejectedCalibrationItem({ calibration }) {
  const firstRejected = calibration?.resultadosReprovados?.[0];
  const instrumentTitle = [
    calibration?.instrumentoTag,
    calibration?.instrumentoDescricao,
  ].filter(Boolean).join(' - ') || 'Instrumento sem identificação';
  const url = calibration?.instrumentoId
    ? `/dashboard/instrumento/${calibration.instrumentoId}?calibracaoId=${calibration.id}`
    : '/dashboard/instrumentos?tab=table';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Box minWidth={0}>
          <Link component={RouterLink} to={url} color="inherit" variant="subtitle2" underline="hover" noWrap>
            {instrumentTitle}
          </Link>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            OS {calibration?.ordemDeServico || 'não informada'} · {fDate(calibration?.data, 'dd/MM/yyyy')}
          </Typography>
          {firstRejected && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {firstRejected.criterioTipo || 'Critério'}: maior erro {firstRejected.maiorErro ?? '-'}
              {firstRejected.incerteza ? ` · incerteza ${firstRejected.incerteza}` : ''}
            </Typography>
          )}
        </Box>
        <Label color="error" sx={{ flexShrink: 0 }}>
          {calibration?.resultadosReprovadosCount || 0} reprovado(s)
        </Label>
      </Box>
    </Box>
  );
}

RejectedCalibrationItem.propTypes = {
  calibration: PropTypes.object,
};
