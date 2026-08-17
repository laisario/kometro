import { describe, expect, it } from '@jest/globals';

import { getCalibrationUploadErrorMessage } from '../../src/clients/hooks/useCalibrationMutation';


describe('getCalibrationUploadErrorMessage', () => {
  it('retorna a mensagem específica para erros identificados pelo backend como storage', () => {
    const error = {
      response: {
        data: {
          error: 'file_storage_error',
          message: 'Erro de armazenamento de arquivos.',
        },
      },
    };

    expect(getCalibrationUploadErrorMessage(error, 'Erro genérico.')).toBe(
      'Erro de armazenamento de arquivos. Tente novamente mais tarde.'
    );
  });

  it('preserva a mensagem existente para outros erros', () => {
    const error = {
      response: {
        data: {
          detail: 'Erro de validação.',
        },
      },
    };

    expect(getCalibrationUploadErrorMessage(error, 'Erro genérico.')).toBe(
      'Erro genérico.'
    );
  });
});
