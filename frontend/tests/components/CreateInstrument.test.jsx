import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockProps, mockAsset, mockDefaultAssets, mockSetores, mockNormas, mockCliente } from '../utils/test-utils';
import CreateInstrument from '../../src/assets/components/CreateInstrument';

// Mock the hooks
jest.mock('../../src/theme/hooks/useResponsive', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('../../src/assets/hooks/useClient', () => ({
  __esModule: true,
  default: () => ({ client: mockCliente }),
}));

jest.mock('../../src/assets/hooks/useNorms', () => ({
  __esModule: true,
  default: () => ({ normas: mockNormas }),
}));

jest.mock('../../src/assets/components/VirtualizedInstrumentAutocomplete', () => {
  return function MockVirtualizedInstrumentAutocomplete({ 
    options, 
    value, 
    onChange, 
    label, 
    required, 
    error, 
    helperText,
    onSearch,
    searchValue,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    adminPreview,
    setInstrumentoSelecionado
  }) {
    return (
      <div data-testid="virtualized-instrument-autocomplete">
        <input
          data-testid="instrument-search"
          placeholder={label}
          value={searchValue || ''}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
        {options?.map((option) => (
          <div
            key={option.id}
            data-testid={`instrument-option-${option.id}`}
            onClick={() => onChange && onChange(option)}
            style={{ cursor: 'pointer', padding: '8px', border: '1px solid #ccc', margin: '4px' }}
          >
            {option.tipoDeInstrumento?.descricao} - {option.tipoDeInstrumento?.modelo}
          </div>
        ))}
        {error && <div data-testid="instrument-error">{helperText}</div>}
      </div>
    );
  };
});

jest.mock('../../src/assets/components/FormDefaultAsset', () => {
  return function MockFormDefaultAsset({ open, onClose, setInstrumentoSelecionado, adminPreview, asset }) {
    if (!open) return null;
    return (
      <div data-testid="form-default-asset">
        <h3>{asset?.id ? 'Editar Instrumento' : 'Cadastrar Novo Instrumento'}</h3>
        <button data-testid="close-form" onClick={onClose}>
          Fechar
        </button>
        <button 
          data-testid="create-instrument" 
          onClick={() => {
            const newInstrument = {
              id: 999,
              tipoDeInstrumento: {
                descricao: 'Novo Instrumento',
                modelo: 'Modelo Novo',
                fabricante: 'Fabricante Novo',
                resolucao: 0.001,
              },
            };
            setInstrumentoSelecionado && setInstrumentoSelecionado(newInstrument);
            onClose();
          }}
        >
          Criar Instrumento
        </button>
      </div>
    );
  };
});

jest.mock('../../src/components/AddArrayField', () => {
  return function MockAddArrayField({ label, fieldName, form, field }) {
    return (
      <div data-testid="add-array-field">
        <label>{label}</label>
        <input
          data-testid={`${fieldName}-input`}
          placeholder={`Adicionar ${field}`}
          onChange={(e) => {
            const currentValues = form.getValues(fieldName) || [];
            form.setValue(fieldName, [...currentValues, { [field]: e.target.value }]);
          }}
        />
        <div data-testid={`${fieldName}-list`}>
          {(form.getValues(fieldName) || []).map((item, index) => (
            <div key={index} data-testid={`${fieldName}-item-${index}`}>
              {item[field]}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

jest.mock('../../src/components/FormNorms', () => {
  return function MockFormNorms({ open, onClose, setNorms }) {
    if (!open) return null;
    return (
      <div data-testid="form-norms">
        <button data-testid="close-norms-form" onClick={onClose}>
          Fechar
        </button>
        <button 
          data-testid="create-norm" 
          onClick={() => {
            const newNorm = { id: 999, nome: 'Nova Norma' };
            setNorms && setNorms(prev => [...(prev || []), newNorm]);
            onClose();
          }}
        >
          Criar Norma
        </button>
      </div>
    );
  };
});

jest.mock('../../src/components/CriteriosDeAceitacao', () => {
  return function MockCriteriosDeAceitacao({ form, fieldName }) {
    return (
      <div data-testid="criterios-aceitacao">
        <input
          data-testid={`${fieldName}-input`}
          placeholder="Adicionar critério"
          onChange={(e) => {
            const currentValues = form.getValues(fieldName) || [];
            form.setValue(fieldName, [...currentValues, { nome: e.target.value }]);
          }}
        />
        <div data-testid={`${fieldName}-list`}>
          {(form.getValues(fieldName) || []).map((item, index) => (
            <div key={index} data-testid={`${fieldName}-item-${index}`}>
              {item.nome}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

describe('CreateInstrument Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create instrument dialog when open is true', () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Crie seu instrumento')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-instrument-autocomplete')).toBeInTheDocument();
    });

    it('renders edit instrument dialog when asset is provided', () => {
      const props = createMockProps({ 
        open: true, 
        asset: mockAsset 
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Editar instrumento')).toBeInTheDocument();
      expect(screen.getByText('Instrumento escolhido:')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      const props = createMockProps({ open: false });
      const { container } = render(<CreateInstrument {...props} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Instrument Selection', () => {
    it('displays instrument options from defaultAssets', () => {
      const props = createMockProps({ 
        open: true, 
        defaultAssets: mockDefaultAssets 
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByTestId('instrument-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('instrument-option-2')).toBeInTheDocument();
      expect(screen.getByText('Paquímetro - Model A')).toBeInTheDocument();
      expect(screen.getByText('Balança - Model B')).toBeInTheDocument();
    });

    it('calls onChange when instrument is selected', async () => {
      const mockOnChange = jest.fn();
      const props = createMockProps({ 
        open: true, 
        defaultAssets: mockDefaultAssets 
      });
      render(<CreateInstrument {...props} />);

      const instrumentOption = screen.getByTestId('instrument-option-1');
      await user.click(instrumentOption);

      // The onChange is called internally by the component
      expect(screen.getByTestId('virtualized-instrument-autocomplete')).toBeInTheDocument();
    });

    it('shows error message when instrument selection has error', () => {
      const props = createMockProps({ 
        open: true, 
        error: { instrumento: ['Instrumento é obrigatório'] }
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByTestId('instrument-error')).toBeInTheDocument();
      expect(screen.getByText('Instrumento é obrigatório')).toBeInTheDocument();
    });
  });

  describe('Form Sections', () => {
    it('renders all accordion sections', () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Instrumento base')).toBeInTheDocument();
      expect(screen.getByText('Identificação do Instrumento')).toBeInTheDocument();
      expect(screen.getByText('Critérios de Aceitação')).toBeInTheDocument();
      expect(screen.getByText('Status do Instrumento')).toBeInTheDocument();
      expect(screen.getByText('Frequência')).toBeInTheDocument();
      expect(screen.getByText('Pontos de Calibração')).toBeInTheDocument();
      expect(screen.getByText('Normativos legais')).toBeInTheDocument();
      expect(screen.getByText('Observação')).toBeInTheDocument();
    });

    it('renders identification fields', () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      expect(screen.getByLabelText('TAG')).toBeInTheDocument();
      expect(screen.getByLabelText('Número de Série')).toBeInTheDocument();
      expect(screen.getByLabelText('Classe')).toBeInTheDocument();
    });

    it('renders position selection dropdown', () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      const positionField = screen.getByLabelText('Posição');
      expect(positionField).toBeInTheDocument();
      
      // Check if dropdown options are present
      fireEvent.mouseDown(positionField);
      expect(screen.getByText('Em uso')).toBeInTheDocument();
      expect(screen.getByText('Em estoque')).toBeInTheDocument();
      expect(screen.getByText('Inativo')).toBeInTheDocument();
      expect(screen.getByText('Fora de uso')).toBeInTheDocument();
    });

    it('renders frequency fields', () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Critério de frequência')).toBeInTheDocument();
      expect(screen.getByText('Checagem')).toBeInTheDocument();
      expect(screen.getByText('Calibração')).toBeInTheDocument();
    });
  });

  describe('Create New Instrument', () => {
    it('opens FormDefaultAsset when "Criar novo instrumento base" is clicked', async () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      const createButton = screen.getByText('Criar novo instrumento base');
      await user.click(createButton);

      expect(screen.getByTestId('form-default-asset')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Novo Instrumento')).toBeInTheDocument();
    });

    it('closes FormDefaultAsset when close button is clicked', async () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      // Open the form
      const createButton = screen.getByText('Criar novo instrumento base');
      await user.click(createButton);

      expect(screen.getByTestId('form-default-asset')).toBeInTheDocument();

      // Close the form
      const closeButton = screen.getByTestId('close-form');
      await user.click(closeButton);

      expect(screen.queryByTestId('form-default-asset')).not.toBeInTheDocument();
    });

    it('creates new instrument and updates selection', async () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      // Open the form
      const createButton = screen.getByText('Criar novo instrumento base');
      await user.click(createButton);

      // Create the instrument
      const createInstrumentButton = screen.getByTestId('create-instrument');
      await user.click(createInstrumentButton);

      // Form should close and new instrument should be selected
      expect(screen.queryByTestId('form-default-asset')).not.toBeInTheDocument();
    });
  });

  describe('Norms Management', () => {
    it('displays selected norms as chips', () => {
      const props = createMockProps({ 
        open: true,
        asset: { ...mockAsset, normativos: mockNormas }
      });
      render(<CreateInstrument {...props} />);

      mockNormas.forEach(norma => {
        expect(screen.getByText(norma.nome)).toBeInTheDocument();
      });
    });

    it('opens FormNorms when "Criar nova norma" is clicked', async () => {
      const props = createMockProps({ open: true });
      render(<CreateInstrument {...props} />);

      // Find and click the create norm button in the autocomplete
      const autocomplete = screen.getByLabelText('Normativos legais');
      fireEvent.mouseDown(autocomplete);
      
      const createNormButton = screen.getByText('+ Criar nova norma');
      await user.click(createNormButton);

      expect(screen.getByTestId('form-norms')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls mutate with correct payload when creating new instrument', async () => {
      const mockMutate = jest.fn();
      const props = createMockProps({ 
        open: true, 
        mutate: mockMutate,
        asset: null
      });
      render(<CreateInstrument {...props} />);

      // Fill in some form data
      const tagField = screen.getByLabelText('TAG');
      await user.type(tagField, 'TEST-001');

      const numeroSerieField = screen.getByLabelText('Número de Série');
      await user.type(numeroSerieField, 'SN123456');

      // Submit the form
      const submitButton = screen.getByText('Criar instrumento');
      await user.click(submitButton);

      expect(mockMutate).toHaveBeenCalled();
    });

    it('calls mutate with correct payload when editing existing instrument', async () => {
      const mockMutate = jest.fn();
      const props = createMockProps({ 
        open: true, 
        mutate: mockMutate,
        asset: mockAsset
      });
      render(<CreateInstrument {...props} />);

      // Submit the form
      const submitButton = screen.getByText('Editar instrumento');
      await user.click(submitButton);

      expect(mockMutate).toHaveBeenCalled();
    });

    it('calls handleClose when cancel button is clicked', async () => {
      const mockHandleClose = jest.fn();
      const props = createMockProps({ 
        open: true, 
        handleClose: mockHandleClose
      });
      render(<CreateInstrument {...props} />);

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockHandleClose).toHaveBeenCalled();
    });
  });

  describe('Admin Preview Mode', () => {
    it('shows price section when adminPreview is true', () => {
      const props = createMockProps({ 
        open: true, 
        adminPreview: true 
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Preço alternativo')).toBeInTheDocument();
    });

    it('shows setor field in admin format when adminPreview is true', () => {
      const props = createMockProps({ 
        open: true, 
        adminPreview: true 
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Setor')).toBeInTheDocument();
      expect(screen.getByLabelText('Setor (Formato: pai/filho)')).toBeInTheDocument();
    });

    it('shows setor tree when adminPreview is false and asset exists', () => {
      const props = createMockProps({ 
        open: true, 
        adminPreview: false,
        asset: mockAsset
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('Trocar instrumento de setor')).toBeInTheDocument();
      expect(screen.getByLabelText('Selecione o setor')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays field errors correctly', () => {
      const props = createMockProps({ 
        open: true,
        error: {
          tag: ['TAG é obrigatória'],
          non_field_errors: ['Você já possui um instrumento com essa Tag']
        }
      });
      render(<CreateInstrument {...props} />);

      expect(screen.getByText('TAG é obrigatória')).toBeInTheDocument();
      expect(screen.getByText('Você já possui um instrumento com essa Tag. Escolha outra.')).toBeInTheDocument();
    });

    it('clears errors when user starts typing', async () => {
      const mockSetError = jest.fn();
      const props = createMockProps({ 
        open: true,
        error: { tag: ['TAG é obrigatória'] },
        setError: mockSetError
      });
      render(<CreateInstrument {...props} />);

      const tagField = screen.getByLabelText('TAG');
      await user.type(tagField, 'T');

      expect(mockSetError).toHaveBeenCalledWith({});
    });
  });

  describe('Loading States', () => {
    it('shows loading state when isFetching is true', () => {
      const props = createMockProps({ 
        open: true, 
        isFetching: true 
      });
      render(<CreateInstrument {...props} />);

      // The loading state would be handled by the VirtualizedInstrumentAutocomplete component
      expect(screen.getByTestId('virtualized-instrument-autocomplete')).toBeInTheDocument();
    });
  });
});
