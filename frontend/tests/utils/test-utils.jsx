import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const theme = createTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Mock data
export const mockAsset = {
  id: 1,
  tag: 'TEST-001',
  numeroDeSerie: 'SN123456',
  classe: 'A',
  posicao: 'U',
  observacao: 'Test instrument',
  frequenciaChecagem: {
    quantidade: 30,
    periodo: 'dia',
  },
  frequenciaCalibracao: {
    quantidade: 12,
    periodo: 'mes',
  },
  pontosDeCalibracao: [
    { nome: 'Ponto 1' },
    { nome: 'Ponto 2' },
  ],
  dataUltimaCalibracao: '2024-01-15',
  dataUltimaChecagem: '2024-01-20',
  criteriosAceitacao: [],
  criterioFrequencia: 'C',
  setor: {
    id: 1,
    nome: 'Test Sector',
    caminhoHierarquia: 'Test/Test Sector',
  },
  instrumento: {
    id: 1,
    tipoDeInstrumento: {
      descricao: 'Paquímetro',
      modelo: 'Model A',
      fabricante: 'Brand X',
      resolucao: 0.01,
    },
    procedimentoRelacionado: {
      codigo: 'PROC-001',
    },
    tipoDeServico: 'A',
    minimo: 0,
    maximo: 150,
    unidade: 'mm',
    tipoSinal: 'D',
    capacidadeDeMedicao: {
      valor: 150,
      unidade: 'mm',
    },
    precoCalibracaoNoCliente: 100.00,
    precoCalibracaoNoLaboratorio: 80.00,
  },
  normativos: [
    { id: 1, nome: 'NBR 10005' },
    { id: 2, nome: 'ISO 9001' },
  ],
  calibracoes: [],
  checagens: [],
};

export const mockDefaultAssets = {
  results: [
    {
      id: 1,
      tipoDeInstrumento: {
        descricao: 'Paquímetro',
        modelo: 'Model A',
        fabricante: 'Brand X',
        resolucao: 0.01,
      },
      procedimentoRelacionado: {
        codigo: 'PROC-001',
      },
      tipoDeServico: 'A',
      minimo: 0,
      maximo: 150,
      unidade: 'mm',
      tipoSinal: 'D',
      capacidadeDeMedicao: {
        valor: 150,
        unidade: 'mm',
      },
      precoCalibracaoNoCliente: 100.00,
      precoCalibracaoNoLaboratorio: 80.00,
    },
    {
      id: 2,
      tipoDeInstrumento: {
        descricao: 'Balança',
        modelo: 'Model B',
        fabricante: 'Brand Y',
        resolucao: 0.001,
      },
      procedimentoRelacionado: {
        codigo: 'PROC-002',
      },
      tipoDeServico: 'NA',
      minimo: 0,
      maximo: 1000,
      unidade: 'g',
      tipoSinal: 'D',
      capacidadeDeMedicao: {
        valor: 1000,
        unidade: 'g',
      },
      precoCalibracaoNoCliente: 120.00,
      precoCalibracaoNoLaboratorio: 90.00,
    },
  ],
};

export const mockSetores = [
  {
    id: 1,
    nome: 'Produção',
    caminhoHierarquia: 'Produção',
    parentId: null,
    depth: 0,
    label: 'Produção',
  },
  {
    id: 2,
    nome: 'Qualidade',
    caminhoHierarquia: 'Produção/Qualidade',
    parentId: 1,
    depth: 1,
    label: 'Qualidade',
  },
  {
    id: 3,
    nome: 'Controle',
    caminhoHierarquia: 'Produção/Qualidade/Controle',
    parentId: 2,
    depth: 2,
    label: 'Controle',
  },
];

export const mockNormas = [
  { id: 1, nome: 'NBR 10005' },
  { id: 2, nome: 'ISO 9001' },
  { id: 3, nome: 'NBR 10007' },
];

export const mockCliente = {
  id: 1,
  nome: 'Test Company',
  criterioFrequenciaPadrao: 'C',
};

export const mockCalibrations = [
  {
    id: 100,
    data: '2024-01-15',
    ordemDeServico: 'OS-001',
    local: 'P',
    observacoes: 'Calibração de teste',
    checagem: false,
    certificados: [],
    resultados: [],
    preco: 150.00,
    laboratorio: 'Lab Test',
  },
  {
    id: 101,
    data: '2024-02-20',
    ordemDeServico: 'OS-002',
    local: 'C',
    observacoes: 'Segunda calibração',
    checagem: false,
    certificados: [],
    resultados: [],
    preco: 200.00,
    laboratorio: 'Lab Test 2',
  }
];

export const mockAssetWithCalibrations = {
  ...mockAsset,
  calibracoes: mockCalibrations,
  checagens: [
    {
      id: 200,
      data: '2024-01-20',
      ordemDeServico: 'CH-001',
      local: 'P',
      observacoes: 'Checagem de teste',
      checagem: true,
      certificados: [],
      resultados: [],
    }
  ],
  historicoPosicoes: [
    {
      id: 1,
      posicaoAnterior: 'E',
      posicaoAtual: 'U',
      dataAlteracao: '2024-01-10',
    }
  ],
  historicoSetores: [
    {
      id: 1,
      setorAnterior: { id: 1, nome: 'Produção' },
      setorAtual: { id: 2, nome: 'Qualidade' },
      dataAlteracao: '2024-01-15',
    }
  ],
  criteriosAceitacao: [
    {
      id: 1,
      tipo: 'Critério 1',
      criterioDeAceitacao: '0.01',
      unidade: 'mm',
      referenciaDoCriterio: 'NBR 10005',
      observacaoCriterioAceitacao: 'Observação teste',
    }
  ],
};

// Helper functions
export const createMockProps = (overrides = {}) => ({
  handleClose: jest.fn(),
  open: true,
  defaultAssets: mockDefaultAssets,
  search: '',
  setSearch: jest.fn(),
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  setor: { type: 'sector', id: 1, parentId: null },
  cliente: mockCliente,
  mutate: jest.fn(),
  asset: null,
  error: {},
  setError: jest.fn(),
  isFetching: false,
  setores: mockSetores,
  adminPreview: false,
  ...overrides,
});

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
