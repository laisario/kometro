import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Alert,
  TextField,
  Checkbox,
  Badge,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import useOrdemServico from '../hooks/useOrdemServico';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';
import { localLabels } from '../../utils/assets';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';
import OrdemServicoFormDialog from './OrdemServicoFormDialog';
import CreateNewOSDialog from './CreateNewOSDialog';

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

// Helper function to render numero certificado column
const renderNumeroCertificado = (
  row, 
  osTipo, 
  onGerarCertificado,
  onEditarCertificado,
  onSalvarCertificado,
  onCancelarEdicao,
  isLoading, 
  instrumentoId,
  editingStates,
  onInputChange
) => {
  const hasCertificado = !!row.numeroCertificado;
  const isCalibracao = osTipo === 'CAL';
  const isGenerating = isLoading && instrumentoId === row.instrumento?.id;
  const instrumentoIdKey = row.instrumento?.id;
  const isEditing = editingStates?.[instrumentoIdKey]?.isEditing || false;
  const inputValue = editingStates?.[instrumentoIdKey]?.value || '';
  
  // If in editing mode (editing existing certificate or new one)
  if (isEditing) {
    const displayValue = inputValue || row.numeroCertificado || '';
    
    return (
      <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 300 }}>
        <TextField
          size="small"
          value={displayValue}
          onChange={(e) => onInputChange(instrumentoIdKey, e.target.value)}
          placeholder="Número de certificado"
          disabled={isGenerating}
          sx={{ flex: 1, minWidth: 200 }}
          inputProps={{ style: { fontSize: '0.875rem' } }}
          autoFocus
        />
        <Tooltip title="Salvar">
          <IconButton
            size="small"
            onClick={() => onSalvarCertificado(instrumentoIdKey, displayValue)}
            disabled={isGenerating || !displayValue.trim()}
            color="primary"
            aria-label="Salvar número de certificado"
          >
            {isGenerating ? (
              <CircularProgress size={16} />
            ) : (
              <CheckCircleIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancelar">
          <IconButton
            size="small"
            onClick={() => onCancelarEdicao(instrumentoIdKey, row.numeroCertificado)}
            disabled={isGenerating}
            color="inherit"
            aria-label="Cancelar"
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
  
  // If has certificate, show it with edit button
  if (hasCertificado) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2">{row.numeroCertificado}</Typography>
        <Tooltip title="Editar número de certificado">
          <IconButton
            size="small"
            onClick={() => onEditarCertificado(instrumentoIdKey, row.numeroCertificado)}
            disabled={isGenerating}
            aria-label="Editar número de certificado"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
  
  // No certificate: show button to generate and save directly
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title="Gerar e salvar número de certificado">
        <IconButton
          size="small"
          onClick={() => onGerarCertificado(instrumentoIdKey)}
          disabled={isGenerating}
          aria-label="Gerar número de certificado"
        >
          {isGenerating ? (
            <CircularProgress size={16} />
          ) : (
            <AddIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
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
        key: 'numero_certificado',
        header: 'Número de Certificado',
        render: (row, index, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange) => 
          renderNumeroCertificado(row, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange),
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
      {
        key: 'numero_certificado',
        header: 'Número de Certificado',
        render: (row, index, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange) => 
          renderNumeroCertificado(row, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange),
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
      { label: 'OS de Recebimento dos Instrumentos', path: 'osRecebimentoDosInstruementos' },
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
      {
        key: 'numero_certificado',
        header: 'Número de Certificado',
        render: (row, index, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange) => 
          renderNumeroCertificado(row, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange),
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
      {
        key: 'numero_certificado',
        header: 'Número de Certificado',
        render: (row, index, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange) => 
          renderNumeroCertificado(row, osTipo, onGerarCertificado, onEditarCertificado, onSalvarCertificado, onCancelarEdicao, isLoading, instrumentoId, editingStates, onInputChange),
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
  const { 
    mutateUpdateStatus, 
    isLoadingUpdateStatus,
    mutateGerarCertificado,
    mutateGerarCertificadoAsync,
    isLoadingGerarCertificado,
    mutateCreateNewOSAndMove,
    isLoadingCreateNewOSAndMove,
  } = useOrdemServicoMutations();
  const [generatingCertificadoId, setGeneratingCertificadoId] = useState(null);
  const [editingStates, setEditingStates] = useState({}); // { instrumentoId: { isEditing: bool, value: string } }
  
  // Selection state
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Clear editing states when dialog closes
  useEffect(() => {
    if (!open) {
      setEditingStates({});
      setGeneratingCertificadoId(null);
      setSelectedInstrumentIds([]);
      setCreateDialogOpen(false);
    }
  }, [open]);
  
  const layoutKey = getOsLayoutKey(osDetails);
  const layout = OS_LAYOUTS[layoutKey] || OS_LAYOUTS.calibracao;
  const items = getOsItems(osDetails);

  // Filter selected IDs to only include instruments that still exist after refetch
  useEffect(() => {
    if (items && items.length > 0) {
      const validIds = items
        .map(item => item.instrumento?.id)
        .filter(Boolean);
      setSelectedInstrumentIds(prev => 
        prev.filter(id => validIds.includes(id))
      );
    }
  }, [items]);
  
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

  const handleGerarCertificado = (instrumentoId) => {
    if (!osDetails?.id || !instrumentoId) return;
    
    setGeneratingCertificadoId(instrumentoId);
    mutateGerarCertificado(
      { osId: osDetails.id, instrumentoId },
      {
        onSuccess: () => {
          refetch();
          setGeneratingCertificadoId(null);
        },
        onError: () => {
          setGeneratingCertificadoId(null);
        },
      }
    );
  };

  const handleEditarCertificado = (instrumentoId, currentValue) => {
    setEditingStates(prev => ({
      ...prev,
      [instrumentoId]: {
        isEditing: true,
        value: currentValue || ''
      }
    }));
  };

  const handleInputChange = (instrumentoId, value) => {
    setEditingStates(prev => ({
      ...prev,
      [instrumentoId]: {
        ...prev[instrumentoId],
        value: value
      }
    }));
  };

  const handleSalvarCertificado = async (instrumentoId, numeroCertificado) => {
    if (!osDetails?.id || !instrumentoId || !numeroCertificado?.trim()) return;
    
    setGeneratingCertificadoId(instrumentoId);
    
    try {
      // Update certificate number using the OS endpoint
      const { axios } = await import('../../api');
      await axios.patch(
        `/ordens-servico/${osDetails.id}/atualizar_certificado/`,
        {
          instrumento_id: instrumentoId,
          numero_certificado: numeroCertificado.trim()
        }
      );
      
      // Success: clear editing state
      setEditingStates(prev => {
        const newData = { ...prev };
        delete newData[instrumentoId];
        return newData;
      });
      setGeneratingCertificadoId(null);
      
      // Refresh data
      refetch();
    } catch (error) {
      setGeneratingCertificadoId(null);
      // Keep editing state on error so user can retry
    }
  };

  const handleCancelarEdicao = (instrumentoId, originalValue) => {
    // Clear editing state, return to original value
    setEditingStates(prev => {
      const newData = { ...prev };
      delete newData[instrumentoId];
      return newData;
    });
  };

  // Selection handlers
  const isInstrumentSelected = (instrumentoId) => {
    return selectedInstrumentIds.includes(instrumentoId);
  };

  const handleToggleInstrument = (instrumentoId) => {
    if (!instrumentoId) return;
    setSelectedInstrumentIds(prev => {
      if (prev.includes(instrumentoId)) {
        return prev.filter(id => id !== instrumentoId);
      }
      return [...prev, instrumentoId];
    });
  };

  const handleSelectAll = () => {
    const allIds = items
      .map(item => item.instrumento?.id)
      .filter(Boolean);
    if (selectedInstrumentIds.length === allIds.length) {
      setSelectedInstrumentIds([]); // Deselect all
    } else {
      setSelectedInstrumentIds(allIds); // Select all
    }
  };

  const handleClearSelection = () => {
    setSelectedInstrumentIds([]);
  };

  // Create new OS handlers
  const handleCreateNewOS = () => {
    if (!osDetails?.id || selectedInstrumentIds.length === 0) return;
    setCreateDialogOpen(true);
  };

  const handleConfirmCreateNewOS = (tipoOs) => {
    if (!osDetails?.id || selectedInstrumentIds.length === 0 || !tipoOs) return;
    
    mutateCreateNewOSAndMove(
      {
        osId: osDetails.id,
        instrumentoIds: selectedInstrumentIds,
        tipoOs,
      },
      {
        onSuccess: () => {
          setSelectedInstrumentIds([]);
          setCreateDialogOpen(false);
          refetch();
        },
      }
    );
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Get selected instruments data for display
  const getSelectedInstruments = () => {
    return items.filter(item => 
      selectedInstrumentIds.includes(item.instrumento?.id)
    );
  };

  const currentStatus = osDetails?.status || 'AR';
  const statusLabel = STATUS_LABELS[currentStatus] || currentStatus;
  const statusColor = getStatusColor(currentStatus);
  const isARealizar = currentStatus === 'AR' || currentStatus === 'a_realizar';
  const editButtonLabel = isARealizar ? 'Preencher OS' : 'Editar';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullScreen={isMobile}>
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

          {/* Bulk Actions Toolbar */}
          {selectedInstrumentIds.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Badge badgeContent={selectedInstrumentIds.length} color="primary">
                  <Typography variant="body2" fontWeight={500}>
                    {selectedInstrumentIds.length} instrumento{selectedInstrumentIds.length !== 1 ? 's' : ''} selecionado{selectedInstrumentIds.length !== 1 ? 's' : ''}
                  </Typography>
                </Badge>
                <Button
                  size="small"
                  onClick={handleClearSelection}
                  variant="text"
                >
                  Limpar seleção
                </Button>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CreateNewFolderIcon />}
                  onClick={handleCreateNewOS}
                  disabled={isLoadingCreateNewOSAndMove}
                >
                  Gerar nova OS
                </Button>
              </Box>
            </Box>
          )}

          {/* Table Section */}
          <Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ fontWeight: 600 }}>
                      <Checkbox
                        size="small"
                        indeterminate={selectedInstrumentIds.length > 0 && selectedInstrumentIds.length < items.length}
                        checked={items.length > 0 && selectedInstrumentIds.length === items.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
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
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={isInstrumentSelected(row.instrumento?.id)}
                            onChange={() => handleToggleInstrument(row.instrumento?.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        {layout.columns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render(
                              row, 
                              index, 
                              osDetails?.tipoOs,
                              handleGerarCertificado,
                              handleEditarCertificado,
                              handleSalvarCertificado,
                              handleCancelarEdicao,
                              isLoadingGerarCertificado,
                              generatingCertificadoId,
                              editingStates,
                              handleInputChange
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={layout.columns.length + 1} align="center">
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

      <CreateNewOSDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        selectedInstruments={getSelectedInstruments()}
        originOsType={osDetails?.tipoOs}
        loading={isLoadingCreateNewOSAndMove}
        onConfirm={handleConfirmCreateNewOS}
      />
    </>
  );
}

export default OrdemServicoDetailsDialog;
