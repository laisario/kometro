import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateInstrument from '../../src/assets/components/CreateInstrument';

const validHierarchy = [
  { id: 1, nome: 'Setor 1', cliente: 10, subsetores: [], instrumentos: [] },
];
const validNodes = {
  1: { id: '1', label: 'Setor 1', type: 'sector', childIds: [], instrumentIds: [] },
};

const mockRefetchSectors = jest.fn();
const mockSelectNode = jest.fn();
let mockContext;

jest.mock('../../src/assets/contexts/SectorTreeContext', () => ({
  useSectorTreeContext: () => mockContext,
}));

jest.mock('../../src/theme/hooks/useResponsive', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('../../src/clients/hooks/useClient', () => ({
  __esModule: true,
  default: () => ({ client: null }),
}));

jest.mock('../../src/assets/hooks/useNorms', () => ({
  __esModule: true,
  default: () => ({ normas: [] }),
}));

jest.mock('../../src/assets/components/VirtualizedInstrumentAutocomplete', () => (
  function MockInstrumentAutocomplete({ onChange }) {
    return <button onClick={() => onChange({ id: 99 })}>Selecionar instrumento base</button>;
  }
));

jest.mock('../../src/assets/components/FormDefaultAsset', () => () => null);
jest.mock('../../src/components/AddArrayField', () => () => null);
jest.mock('../../src/components/FormNorms', () => () => null);
jest.mock('../../src/components/CriteriosDeAceitacao', () => () => null);

jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));

const defaultProps = {
  handleClose: jest.fn(),
  open: true,
  defaultAssets: { results: [] },
  search: '',
  setSearch: jest.fn(),
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  setor: { id: 1, type: 'sector', parentId: null },
  cliente: 10,
  mutate: jest.fn(),
  asset: null,
  error: {},
  setError: jest.fn(),
  isFetching: false,
};

describe('CreateInstrument - consistência do setor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetchSectors.mockResolvedValue({ data: validHierarchy, isError: false });
    mockContext = {
      clienteId: 10,
      nodes: validNodes,
      rootIds: ['1'],
      hasLoadedTree: true,
      isLoadingTree: false,
      refetchSectors: mockRefetchSectors,
      selectNode: mockSelectNode,
    };
  });

  it('aguarda o refetch final antes de realizar o POST', async () => {
    const order = [];
    let resolveFinalRefetch;
    mockRefetchSectors
      .mockResolvedValueOnce({ data: validHierarchy, isError: false })
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveFinalRefetch = () => {
          order.push('refetch concluído');
          resolve({ data: validHierarchy, isError: false });
        };
      }));
    const mutate = jest.fn(() => order.push('post'));

    render(<CreateInstrument {...defaultProps} mutate={mutate} />);
    await waitFor(() => expect(mockRefetchSectors).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Criar instrumento' }));
    await waitFor(() => expect(mockRefetchSectors).toHaveBeenCalledTimes(2));
    expect(mutate).not.toHaveBeenCalled();

    resolveFinalRefetch();

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(order).toEqual(['refetch concluído', 'post']);
    expect(mutate.mock.calls[0][0].setor).toBe(1);
  });

  it('faz apenas um refetch ao abrir e não repete por render ou alteração de campo', async () => {
    const view = render(<CreateInstrument {...defaultProps} />);
    await waitFor(() => expect(mockRefetchSectors).toHaveBeenCalledTimes(1));

    mockContext = { ...mockContext, isFetchingTree: true };
    view.rerender(<CreateInstrument {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('TAG'), { target: { value: 'SEM-NOVO-GET' } });

    mockContext = { ...mockContext, isFetchingTree: false };
    view.rerender(<CreateInstrument {...defaultProps} />);

    expect(mockRefetchSectors).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('TAG')).toHaveValue('SEM-NOVO-GET');

    jest.useFakeTimers();
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(mockRefetchSectors).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('mantém uma seleção válida durante o estado intermediário de fetching', async () => {
    const view = render(
      <CreateInstrument {...defaultProps} tableViewCreate setor={null} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Selecione o setor'));
    await user.click(await screen.findByText('Setor 1'));

    mockContext = { ...mockContext, isFetchingTree: true };
    view.rerender(<CreateInstrument {...defaultProps} tableViewCreate setor={null} />);

    expect(screen.getByLabelText('Selecione o setor')).toHaveValue('Setor 1');
    expect(screen.queryByText(/Este setor não está mais disponível/)).not.toBeInTheDocument();
  });

  it('bloqueia o POST quando o setor desapareceu no refetch final', async () => {
    mockRefetchSectors
      .mockResolvedValueOnce({ data: validHierarchy, isError: false })
      .mockResolvedValueOnce({ data: [], isError: false });
    const mutate = jest.fn();

    render(<CreateInstrument {...defaultProps} mutate={mutate} />);
    await waitFor(() => expect(mockRefetchSectors).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Criar instrumento' }));

    await waitFor(() => expect(mockRefetchSectors).toHaveBeenCalledTimes(2));
    expect(mutate).not.toHaveBeenCalled();
    expect(mockSelectNode).toHaveBeenCalledWith(null);
  });

  it('não utiliza a seleção de um cliente anterior após a troca de login', async () => {
    const mutate = jest.fn();
    mockContext = {
      ...mockContext,
      clienteId: 20,
      nodes: {},
      rootIds: [],
    };

    render(<CreateInstrument {...defaultProps} mutate={mutate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar instrumento' }));

    await waitFor(() => expect(mockSelectNode).toHaveBeenCalledWith(null));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('invalida setorId quando a opção desaparece', async () => {
    const mutate = jest.fn();
    const view = render(
      <CreateInstrument {...defaultProps} tableViewCreate setor={null} mutate={mutate} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Selecione o setor'));
    await user.click(await screen.findByText('Setor 1'));
    expect(screen.getByLabelText('Selecione o setor')).toHaveValue('Setor 1');

    mockContext = { ...mockContext, nodes: {}, rootIds: [] };
    view.rerender(
      <CreateInstrument {...defaultProps} tableViewCreate setor={null} mutate={mutate} />,
    );

    await waitFor(() => expect(screen.getByLabelText('Selecione o setor')).toHaveValue(''));
    expect(screen.getByText(/Este setor não está mais disponível/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Criar instrumento' }));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('não reutiliza setor após cancelar e reabrir', async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)}>Abrir novamente</button>
          <CreateInstrument
            {...defaultProps}
            open={open}
            tableViewCreate
            setor={null}
            handleClose={() => setOpen(false)}
          />
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByLabelText('Selecione o setor'));
    await user.click(await screen.findByText('Setor 1'));
    expect(screen.getByLabelText('Selecione o setor')).toHaveValue('Setor 1');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByText('Abrir novamente'));

    expect(screen.getByLabelText('Selecione o setor')).toHaveValue('');
  });

  it('limpa o estado transitório após criação bem-sucedida', async () => {
    const mutate = jest.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      const handleMutation = (payload, callbacks) => {
        mutate(payload, callbacks);
        callbacks.onSuccess();
        setOpen(false);
      };

      return (
        <>
          <button onClick={() => setOpen(true)}>Reabrir após sucesso</button>
          <CreateInstrument
            {...defaultProps}
            open={open}
            tableViewCreate
            setor={null}
            mutate={handleMutation}
            handleClose={() => setOpen(false)}
          />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByLabelText('Selecione o setor'));
    await user.click(await screen.findByText('Setor 1'));
    fireEvent.change(screen.getByLabelText('TAG'), { target: { value: 'LIMPAR' } });

    fireEvent.click(screen.getByRole('button', { name: 'Criar instrumento' }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByText('Reabrir após sucesso'));
    await waitFor(() => expect(screen.getByLabelText('Selecione o setor')).toHaveValue(''));
    await waitFor(() => expect(screen.getByLabelText('TAG')).toHaveValue(''));
  });

  it('atualiza setores e limpa somente a seleção após rejeição concorrente', async () => {
    mockRefetchSectors
      .mockResolvedValueOnce({ data: validHierarchy, isError: false })
      .mockResolvedValueOnce({ data: validHierarchy, isError: false })
      .mockResolvedValueOnce({ data: [], isError: false });
    const sectorError = { response: { status: 400, data: { setor: ['PK inválido'] } } };
    const mutate = jest.fn((_payload, callbacks) => callbacks.onError(sectorError));

    render(<CreateInstrument {...defaultProps} mutate={mutate} />);
    fireEvent.change(screen.getByLabelText('TAG'), { target: { value: 'PRESERVAR' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar instrumento' }));

    await waitFor(() => expect(mockRefetchSectors).toHaveBeenCalledTimes(3));
    expect(mockSelectNode).toHaveBeenCalledWith(null);
    expect(screen.getByLabelText('TAG')).toHaveValue('PRESERVAR');
  });
});
