import {
  getCreateInstrumentClientErrorMessage,
  isSectorValidationError,
  SECTOR_UNAVAILABLE_MESSAGE,
} from '../../src/assets/hooks/useAssetMutations';

describe('tratamento de erro concorrente de setor', () => {
  it('reconhece apenas erro 400 associado ao campo setor', () => {
    const sectorError = { response: { status: 400, data: { setor: ['PK inválido'] } } };
    const anotherValidationError = { response: { status: 400, data: { tag: ['Obrigatória'] } } };

    expect(isSectorValidationError(sectorError)).toBe(true);
    expect(isSectorValidationError(anotherValidationError)).toBe(false);
    expect(getCreateInstrumentClientErrorMessage(sectorError)).toBe(SECTOR_UNAVAILABLE_MESSAGE);
    expect(getCreateInstrumentClientErrorMessage(anotherValidationError)).toBe('Tag - Obrigatória');
  });
});
