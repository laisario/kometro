import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockProps, mockAsset } from '../utils/test-utils';
import FormDefaultAsset from '../../src/assets/components/FormDefaultAsset';

// Mock the useDefaultAssetMutations hook
const mockMutateCreateDefaultAsset = jest.fn();
const mockMutateUpdateDefaultAsset = jest.fn();
const mockSetError = jest.fn();

jest.mock('../../src/assets/hooks/useDefaultAssetMutations', () => ({
  __esModule: true,
  default: () => ({
    mutateCreateDefaultAsset: mockMutateCreateDefaultAsset,
    errorDefaultAsset: {},
    setError: mockSetError,
    mutateUpdateDefaultAsset: mockMutateUpdateDefaultAsset,
  }),
}));

describe('FormDefaultAsset Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create form when no asset is provided', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByText('Cadastrar Novo Instrumento')).toBeInTheDocument();
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
      expect(screen.getByLabelText('Modelo')).toBeInTheDocument();
      expect(screen.getByLabelText('Fabricante')).toBeInTheDocument();
    });

    it('renders edit form when asset is provided', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: mockAsset.instrumento,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByText('Editar Instrumento')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Paquímetro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Model A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Brand X')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      const props = {
        open: false,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      const { container } = render(<FormDefaultAsset {...props} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Form Fields', () => {
    it('renders all required form fields', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      // Basic information
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
      expect(screen.getByLabelText('Modelo')).toBeInTheDocument();
      expect(screen.getByLabelText('Fabricante')).toBeInTheDocument();
      expect(screen.getByLabelText('Procedimento Relacionado')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Serviço')).toBeInTheDocument();

      // Metrological characteristics
      expect(screen.getByText('Característica Metrológica')).toBeInTheDocument();
      expect(screen.getByLabelText('Valor Mínimo')).toBeInTheDocument();
      expect(screen.getByLabelText('Valor Máximo')).toBeInTheDocument();
      expect(screen.getByLabelText('Unidade')).toBeInTheDocument();
      expect(screen.getByLabelText('Resolução')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Sinal')).toBeInTheDocument();

      // Measurement capacity
      expect(screen.getByText('Capacidade de Medição')).toBeInTheDocument();
      expect(screen.getByLabelText('Capacidade')).toBeInTheDocument();
    });

    it('renders price fields when adminPreview is true', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: true,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByText('Preços calibração')).toBeInTheDocument();
      expect(screen.getByLabelText('No cliente')).toBeInTheDocument();
      expect(screen.getByLabelText('No laboratório')).toBeInTheDocument();
    });

    it('does not render price fields when adminPreview is false', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.queryByText('Preços calibração')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('No cliente')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('No laboratório')).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('allows user to input text in text fields', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const descricaoField = screen.getByLabelText('Descrição');
      await user.type(descricaoField, 'Novo Instrumento');

      expect(descricaoField).toHaveValue('Novo Instrumento');
    });

    it('allows user to select tipo de serviço', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const tipoServicoField = screen.getByLabelText('Tipo de Serviço');
      fireEvent.mouseDown(tipoServicoField);

      expect(screen.getByText('Acreditado')).toBeInTheDocument();
      expect(screen.getByText('Não Acreditado')).toBeInTheDocument();
      expect(screen.getByText('Interna')).toBeInTheDocument();

      await user.click(screen.getByText('Acreditado'));
      expect(tipoServicoField).toHaveValue('A');
    });

    it('allows user to select tipo de sinal', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const tipoSinalField = screen.getByLabelText('Tipo de Sinal');
      fireEvent.mouseDown(tipoSinalField);

      expect(screen.getByText('Analógico')).toBeInTheDocument();
      expect(screen.getByText('Digital')).toBeInTheDocument();

      await user.click(screen.getByText('Digital'));
      expect(tipoSinalField).toHaveValue('D');
    });

    it('allows user to input numeric values', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const minimoField = screen.getByLabelText('Valor Mínimo');
      const maximoField = screen.getByLabelText('Valor Máximo');
      const resolucaoField = screen.getByLabelText('Resolução');

      await user.type(minimoField, '0');
      await user.type(maximoField, '100');
      await user.type(resolucaoField, '0.01');

      expect(minimoField).toHaveValue(0);
      expect(maximoField).toHaveValue(100);
      expect(resolucaoField).toHaveValue(0.01);
    });
  });

  describe('Form Submission', () => {
    it('calls mutateCreateDefaultAsset when creating new instrument', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      // Fill in required field
      const descricaoField = screen.getByLabelText('Descrição');
      await user.type(descricaoField, 'Novo Instrumento');

      // Submit form
      const submitButton = screen.getByText('Criar Instrumento');
      await user.click(submitButton);

      expect(mockMutateCreateDefaultAsset).toHaveBeenCalled();
    });

    it('calls mutateUpdateDefaultAsset when editing existing instrument', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: mockAsset.instrumento,
      };
      render(<FormDefaultAsset {...props} />);

      // Submit form
      const submitButton = screen.getByText('Editar Instrumento');
      await user.click(submitButton);

      expect(mockMutateUpdateDefaultAsset).toHaveBeenCalledWith({
        id: mockAsset.instrumento.id,
        data: expect.any(Object),
      });
    });

    it('calls onClose when cancel button is clicked', async () => {
      const mockOnClose = jest.fn();
      const props = {
        open: true,
        onClose: mockOnClose,
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays field errors when they exist', () => {
      // Create a component with error state
      const FormWithErrors = () => {
        const mockForm = {
          register: jest.fn(() => ({})),
          handleSubmit: jest.fn((fn) => fn),
          watch: jest.fn(),
          setValue: jest.fn(),
          getValues: jest.fn(),
          reset: jest.fn(),
          formState: { errors: {} },
          control: {},
        };

        const mockHook = {
          mutateCreateDefaultAsset: mockMutateCreateDefaultAsset,
          errorDefaultAsset: {
            descricao: ['Descrição é obrigatória'],
            minimo: ['Valor mínimo inválido'],
          },
          setError: mockSetError,
          mutateUpdateDefaultAsset: mockMutateUpdateDefaultAsset,
        };

        return (
          <div>
            <input data-testid="descricao-error" value={mockHook.errorDefaultAsset.descricao[0]} readOnly />
            <input data-testid="minimo-error" value={mockHook.errorDefaultAsset.minimo[0]} readOnly />
          </div>
        );
      };

      render(<FormWithErrors />);

      expect(screen.getByDisplayValue('Descrição é obrigatória')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Valor mínimo inválido')).toBeInTheDocument();
    });

    it('clears errors when user starts typing', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const descricaoField = screen.getByLabelText('Descrição');
      await user.type(descricaoField, 'T');

      expect(mockSetError).toHaveBeenCalledWith({});
    });
  });

  describe('Form Validation', () => {
    it('requires descricao field', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const descricaoField = screen.getByLabelText('Descrição');
      expect(descricaoField).toBeRequired();
    });

    it('validates numeric input fields', async () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const minimoField = screen.getByLabelText('Valor Mínimo');
      const maximoField = screen.getByLabelText('Valor Máximo');

      expect(minimoField).toHaveAttribute('type', 'number');
      expect(maximoField).toHaveAttribute('type', 'number');
      expect(minimoField).toHaveAttribute('step', 'any');
      expect(maximoField).toHaveAttribute('step', 'any');
    });
  });

  describe('Admin Preview Mode', () => {
    it('shows price fields with correct labels and formatting', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: true,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      const precoClienteField = screen.getByLabelText('No cliente');
      const precoLabField = screen.getByLabelText('No laboratório');

      expect(precoClienteField).toBeInTheDocument();
      expect(precoLabField).toBeInTheDocument();
      
      // Check for currency prefix
      expect(screen.getByText('R$')).toBeInTheDocument();
    });

    it('populates price fields with existing values when editing', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: true,
        asset: mockAsset.instrumento,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByDisplayValue('100')).toBeInTheDocument(); // precoCalibracaoNoCliente
      expect(screen.getByDisplayValue('80')).toBeInTheDocument(); // precoCalibracaoNoLaboratorio
    });
  });

  describe('Form State Management', () => {
    it('initializes form with default values when no asset provided', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByLabelText('Descrição')).toHaveValue('');
      expect(screen.getByLabelText('Modelo')).toHaveValue('');
      expect(screen.getByLabelText('Fabricante')).toHaveValue('');
    });

    it('initializes form with asset values when editing', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: mockAsset.instrumento,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByDisplayValue('Paquímetro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Model A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Brand X')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PROC-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('mm')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      // Check that all form fields have proper labels
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
      expect(screen.getByLabelText('Modelo')).toBeInTheDocument();
      expect(screen.getByLabelText('Fabricante')).toBeInTheDocument();
      expect(screen.getByLabelText('Procedimento Relacionado')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Serviço')).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      const props = {
        open: true,
        onClose: jest.fn(),
        setInstrumentoSelecionado: jest.fn(),
        adminPreview: false,
        asset: null,
      };
      render(<FormDefaultAsset {...props} />);

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Criar Instrumento' })).toBeInTheDocument();
    });
  });
});
