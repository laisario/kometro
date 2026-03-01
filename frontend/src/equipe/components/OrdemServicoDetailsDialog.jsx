import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import useOrdemServico from '../hooks/useOrdemServico';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';
import { localLabels } from '../../utils/assets';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';
import OrdemServicoFormDialog from './OrdemServicoFormDialog';

// Status labels mapping
const STATUS_LABELS = {
  'AR': 'A realizar',
  'a_realizar': 'A realizar',
  'EA': 'Em andamento',
  'em_andamento': 'Em andamento',
  'RE': 'Realizado',
  'realizado': 'Realizado',
  'CA': 'Cancelado',
  'cancelado': 'Cancelado',
};

const STATUS_OPTIONS = [
  { value: 'AR', label: 'A realizar' },
  { value: 'EA', label: 'Em andamento' },
  { value: 'RE', label: 'Realizado' },
  { value: 'CA', label: 'Cancelado' },
];

const getStatusColor = (status) => {
  if (status === 'AR' || status === 'a_realizar') return 'warning';
  if (status === 'EA' || status === 'em_andamento') return 'info';
  if (status === 'RE' || status === 'realizado') return 'success';
  if (status === 'CA' || status === 'cancelado') return 'error';
  return 'default';
};

// Helper functions
const safeGet = (obj, path, fallback = '—') => {
  if (!path || !obj) return fallback;
  try {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
    return value != null && value !== '' ? value : fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (date, format = 'dd/MM/yyyy') => {
  if (!date) return '—';
  return fDate(date, format);
};

const getOsLayoutKey = (os) => {
  if (!os?.tipoOs) return 'calibracao'; // Default fallback
  
  const tipoMap = {
    'CAL': 'calibracao',
    'BAL': 'balancas',
    'MAN': 'manutencao',
    'EXT': 'externa',
  };
  
  return tipoMap[os.tipoOs] || 'calibracao';
};

const getOsItems = (os) => {
  // Items are in instrumentosOs (camelCase)
  return os?.instrumentosOs || [];
};

// Layout configurations
const OS_LAYOUTS = {
  calibracao: {
    title: 'Ordem de Serviço de Calibração',
    subtitle: null,
    headerLeftFields: [
      { label: 'Número OS', path: 'numero' },
      { label: 'Cliente', path: 'clienteNome' },
      { label: 'CNPJ', path: "clienteCnpj" }, 
      { label: 'Número Proposta', path: 'propostaNumero' },
      { label: 'Data de Recebimento dos Instrumentos', path: 'dataRecebimentoInstrumentos', formatter: formatDate },
    ],
    columns: [
      {
        key: 'item',
        header: 'Item',
        render: (row, index) => row.item ?? index + 1,
      },
      {
        key: 'descricao',
        header: 'Descrição',
        render: (row) => row.instrumento?.instrumento?.tipoDeInstrumento?.descricao ?? '—',
      },
      {
        key: 'tag',
        header: 'Tag',
        render: (row) => row.instrumento?.tag ?? '—',
      },
      {
        key: 'local',
        header: 'Local',
        render: (row) => localLabels[row.local] ?? '—',
      },
      {
        key: 'tipo_servico',
        header: 'Tipo de Serviço',
        render: (row) => row.tipoServico ?? '—',
      },
      {
        key: 'observacoes',
        header: 'Observações',
        render: (row) => row.observacao ?? '—',
      },
    ],
    footerFields: [
      { label: 'Data de Liberação dos Instrumentos', path: 'dataLiberacaoInstrumentos', formatter: formatDate },
      { label: 'Responsável', path: 'responsavelNome' },
    ],
  },
  balancas: {
    title: 'Ordem de Serviço de Manutenção de Balanças',
    subtitle: 'Autorizada pelo órgão metrológico sob nº 70000625',
    headerLeftFields: [
      { label: 'Número OS', path: 'numero' },
      { label: 'Cliente', path: 'clienteNome' },
      { label: 'CNPJ', path: "clienteCnpj" }, 
      { label: 'Número Proposta', path: 'propostaNumero' },
      { label: 'Data de Recebimento dos Instrumentos', path: 'dataRecebimentoInstrumentos', formatter: formatDate },
    ],
    columns: [
      {
        key: 'item',
        header: 'Item',
        render: (row, index) => row.item ?? index + 1,
      },
      {
        key: 'descricao',
        header: 'Descrição',
        render: (row) => row.instrumento?.instrumento?.tipoDeInstrumento?.descricao ?? '—',
      },
      {
        key: 'tag',
        header: 'Tag',
        render: (row) => row.instrumento?.tag ?? '—',
      },
      {
        key: 'fabricante',
        header: 'Fabricante',
        render: (row) => row.fabricante ?? row.instrumento?.instrumento?.tipoDeInstrumento?.fabricante ?? '—',
      },
      {
        key: 'numero_serie',
        header: 'Nº de Série',
        render: (row) => row.numeroSerie ?? row.instrumento?.numeroDeSerie ?? '—',
      },
      {
        key: 'carga_maxima',
        header: 'Carga Máxima',
        render: (row) => row.cargaMaxima ?? row.instrumento?.instrumento?.maximo ?? '—',
      },
      {
        key: 'local',
        header: 'Local',
        render: (row) => localLabels[row.local] ?? '—',
      },
      {
        key: 'marca_reparo',
        header: 'Marca de Reparo',
        render: (row) => row.marcaReparo ? 'Sim' : 'Não',
      },
      {
        key: 'marca_selagem_retirada',
        header: 'Marca de Selagem Retirada',
        render: (row) => row.marcaSelagemRetirada ?? '—',
      },
      {
        key: 'marca_selagem_nova',
        header: 'Marca de Selagem Nova',
        render: (row) => row.marcaSelagemNova ? 'Sim' : 'Não',
      },
      {
        key: 'servico_executado',
        header: 'Serviço Executado',
        render: (row) => row.servicoExecutado ?? '—',
      },
      {
        key: 'observacao',
        header: 'Observação',
        render: (row) => row.observacao ?? '—',
      },
    ],
    footerFields: [
      { label: 'Data', path: 'dataCriacao', formatter: formatDate },
      { label: 'Responsável', path: 'responsavelNome' },
    ],
  },
  manutencao: {
    title: 'Ordem de Serviço de Manutenção',
    subtitle: null,
    headerLeftFields: [
      { label: 'Número OS', path: 'numero' },
      { label: 'Cliente', path: 'clienteNome' },
      { label: 'CNPJ', path: "clienteCnpj" }, 
      { label: 'Número Proposta', path: 'propostaNumero' },
      { label: 'OS de Recebimento dos Instrumentos', path: null, static: true }, // Static field
    ],
    columns: [
      {
        key: 'item',
        header: 'Item',
        render: (row, index) => row.item ?? index + 1,
      },
      {
        key: 'descricao',
        header: 'Descrição',
        render: (row) => row.instrumento?.instrumento?.tipoDeInstrumento?.descricao ?? '—',
      },
      {
        key: 'tag',
        header: 'Tag',
        render: (row) => row.instrumento?.tag ?? '—',
      },
      {
        key: 'descricao_anomalia',
        header: 'Descrição da Anomalia',
        render: (row) => row.descricaoAnomalia ?? '—',
      },
      {
        key: 'observacao',
        header: 'Observação',
        render: (row) => row.observacao ?? '—',
      },
    ],
    footerFields: [
      { label: 'Data de Liberação dos Instrumentos', path: 'dataLiberacaoInstrumentos', formatter: formatDate },
      { label: 'Responsável', path: 'responsavelNome' },
    ],
  },
  externa: {
    title: 'Ordem de Serviço de Calibração Externa',
    subtitle: null,
    headerLeftFields: [
      { label: 'Número OS', path: 'numero' },
      { label: 'Cliente', path: 'clienteNome' },
      { label: 'CNPJ', path: "clienteCnpj" }, 
      { label: 'Número Proposta', path: 'propostaNumero' },
      { label: 'Data de Calibração dos Instrumentos', path: 'dataCalibracaoInstrumentos', formatter: formatDate },
    ],
    columns: [
      {
        key: 'item',
        header: 'Item',
        render: (row, index) => row.item ?? index + 1,
      },
      {
        key: 'quantidade',
        header: 'Quantidade',
        render: (row) => row.quantidade ?? '—',
      },
      {
        key: 'descricao',
        header: 'Descrição',
        render: (row) => row.instrumento?.instrumento?.tipoDeInstrumento?.descricao ?? '—',
      },
      {
        key: 'observacao',
        header: 'Observação',
        render: (row) => row.observacao ?? '—',
      },
    ],
    footerFields: [
      { label: 'Data de Liberação da Calibração', path: 'dataLiberacaoCalibracao', formatter: formatDate },
      { label: 'Responsável', path: 'responsavelNome' },
    ],
  },
};

// Static header right block (same for all types)
const HEADER_RIGHT_STATIC = (
  <Box>
    <Typography variant="body2">FQ-49</Typography>
    <Typography variant="body2">Rev.4</Typography>
    <Typography variant="body2">Aprovação: 09/01/2025</Typography>
    <Typography variant="body2">Validade: 09/01/2030</Typography>
  </Box>
);

function OrdemServicoDetailsDialog({ open, onClose, ordemServico }) {
  const isMobile = useResponsive('down', 'sm');
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { ordemServico: osDetails, isLoadingOrdemServico, errorOrdemServico, refetch } = useOrdemServico(
    ordemServico?.id,
    { enabled: open && !!ordemServico?.id }
  );
  const { mutateUpdateStatus, isLoadingUpdateStatus } = useOrdemServicoMutations();

  if (!osDetails) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle>Detalhes da Ordem de Serviço</DialogTitle>
        <DialogContent>
          {isLoadingOrdemServico ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : errorOrdemServico ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={3}>
              <Typography variant="body1" color="error">
                Erro ao carregar detalhes da ordem de serviço
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const layoutKey = getOsLayoutKey(osDetails);
  const layout = OS_LAYOUTS[layoutKey] || OS_LAYOUTS.calibracao;
  const items = getOsItems(osDetails);

  // Render header/footer field value
  const renderHeaderFieldValue = (field) => {
    if (field.static || !field.path) {
      return '—';
    }
    const value = safeGet(osDetails, field.path, null);
    if (value === null || value === '—') return '—';
    return field.formatter ? field.formatter(value) : value;
  };

  const handleStatusMenuOpen = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = (newStatus) => {
    if (osDetails?.id && newStatus !== osDetails.status) {
      mutateUpdateStatus(
        { id: osDetails.id, status: newStatus },
        {
          onSuccess: () => {
            refetch();
            handleStatusMenuClose();
          },
        }
      );
    } else {
      handleStatusMenuClose();
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditSaved = () => {
    refetch();
  };

  const currentStatus = osDetails?.status || 'AR';
  const statusLabel = STATUS_LABELS[currentStatus] || currentStatus;
  const statusColor = getStatusColor(currentStatus);
  const isARealizar = currentStatus === 'AR' || currentStatus === 'a_realizar';
  const editButtonLabel = isARealizar ? 'Preencher OS' : 'Editar';

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="span">
              {layout.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={statusLabel}
                color={statusColor}
                variant="outlined"
                size="small"
                onClick={handleStatusMenuOpen}
                icon={<ArrowDropDownIcon />}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} mt={1}>
          {/* Subtitle */}
          {layout.subtitle && (
            <Typography variant="body2" color="text.secondary">
              {layout.subtitle}
            </Typography>
          )}

          {/* Header Section */}
          <Box display="flex" justifyContent="space-between" gap={4} flexWrap="wrap">
            {/* Left Header Fields */}
            <Box flex={1} minWidth={200}>
              {layout.headerLeftFields.map((field, idx) => (
                <Box key={idx} mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {field.label}
                  </Typography>
                  <Typography variant="body1">
                    {renderHeaderFieldValue(field)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Right Header Static Block */}
            <Box>
              {HEADER_RIGHT_STATIC}
            </Box>
          </Box>

          <Divider />

          {/* Table Section */}
          <Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {layout.columns.map((col) => (
                      <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                        {col.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((row, index) => (
                      <TableRow key={row.id || index}>
                        {layout.columns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render(row, index)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={layout.columns.length} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Nenhum instrumento associado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider />

          {/* Footer Section */}
          <Box display="flex" gap={4} flexWrap="wrap">
            {layout.footerFields.map((field, idx) => (
              <Box key={idx} minWidth={200}>
                <Typography variant="subtitle2" color="text.secondary">
                  {field.label}
                </Typography>
                <Typography variant="body1">
                  {renderHeaderFieldValue(field)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
        <Button
          onClick={handleEditClick}
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
        >
          {editButtonLabel}
        </Button>
      </DialogActions>
      </Dialog>

      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            selected={currentStatus === option.value}
            disabled={isLoadingUpdateStatus}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <OrdemServicoFormDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        mode="edit"
        os={osDetails}
        onSaved={handleEditSaved}
      />
    </>
  );
}

export default OrdemServicoDetailsDialog;
