import { render, screen } from '@testing-library/react';
import SearchWithDropdown from '../../src/assets/components/SearchWithDropdown';

describe('SearchWithDropdown', () => {
  it('informa que a busca aceita o número do certificado', () => {
    render(
      <SearchWithDropdown
        data={{ results: [] }}
        search=""
        setSearch={jest.fn()}
        onSelect={jest.fn()}
        isFetching={false}
      />
    );

    expect(
      screen.getByPlaceholderText(
        'Buscar por tag, descrição ou nº do certificado...'
      )
    ).toBeInTheDocument();
  });
});
