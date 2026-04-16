import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import InstrumentServiceSelectionTable from '../../src/proposals/components/InstrumentServiceSelectionTable';

const baseInstrument = {
  id: 1,
  tag: 'TAG-001',
  numeroDeSerie: 'SN-123',
  instrumento: {
    tipoDeInstrumento: { descricao: 'Termômetro' },
    precoCalibracaoNoCliente: '100.00',
    precoCalibracaoNoLaboratorio: '80.00',
  },
  service_kind: 'calibracao',
  local: 'P',
  tipoDeServico: null,
  preco: null,
};

describe('InstrumentServiceSelectionTable — Tipo column', () => {
  it('renders Tipo column header', () => {
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={() => {}}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText('Tipo')).toBeInTheDocument();
  });

  it('renders Tipo select with Não definido when tipoDeServico is null', () => {
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={() => {}}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText('Não definido')).toBeInTheDocument();
  });

  it('shows current tipoDeServico value when pre-set to A', () => {
    const instrument = { ...baseInstrument, tipoDeServico: 'A' };
    render(
      <InstrumentServiceSelectionTable
        instruments={[instrument]}
        onChange={() => {}}
        onRemove={() => {}}
      />
    );
    // MUI Select renders the selected value as visible text in the button
    expect(screen.getByText('Acreditado')).toBeInTheDocument();
  });

  it('calls onChange with updated tipoDeServico when user selects NA', () => {
    const handleChange = jest.fn();
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={handleChange}
        onRemove={() => {}}
      />
    );

    // Find the Tipo select — it's the last Select in the row (after the Local select).
    // MUI Select renders its trigger as a div with role="combobox".
    const comboboxes = screen.getAllByRole('combobox');
    const tipoSelect = comboboxes[comboboxes.length - 1];

    // Open the dropdown
    fireEvent.mouseDown(tipoSelect);

    // Click the "Não acreditado" option in the open menu
    const naOption = screen.getByText('Não acreditado');
    fireEvent.click(naOption);

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, tipoDeServico: 'NA' }),
      ])
    );
  });

  it('Tipo column appears in showPreco=true mode alongside Preço column', () => {
    render(
      <InstrumentServiceSelectionTable
        instruments={[baseInstrument]}
        onChange={() => {}}
        onRemove={() => {}}
        showPreco
      />
    );
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Preço (R$)')).toBeInTheDocument();
  });
});
