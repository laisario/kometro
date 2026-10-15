import { useLayoutEffect, useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import CalibrationPanel from '../../src/clients/components/CalibrationPanel';

const mockCalibrationsByAsset = {
  7: [
    { id: 50, data: '2026-06-01', certificados: [{ numero: 'RECENTE' }] },
    { id: 31, data: '2026-03-31', certificados: [{ numero: '3333333' }] },
  ],
  8: [
    { id: 44, data: '2025-01-10', certificados: [{ numero: 'OUTRO' }] },
  ],
};

jest.mock('../../src/clients/hooks/useCalibration', () => ({
  __esModule: true,
  default: (id, search, assetId) => ({
    data: mockCalibrationsByAsset[assetId] || [],
    isLoadingCalibrations: false,
    isFetchingCalibrations: false,
  }),
}));

jest.mock('../../src/clients/components/Calibrations', () => () => null);
jest.mock('../../src/clients/components/PreviewCalibration', () => ({ calibration }) => (
  <div data-testid="preview-calibration">{calibration?.id || 'nenhuma'}</div>
));

const noop = jest.fn();

function Harness({ assetId, selectedCalibrationId, initialCalibration = {} }) {
  const [selectedCalibration, setSelectedCalibration] = useState(initialCalibration);
  const previousAssetId = useRef(assetId);
  useLayoutEffect(() => {
    if (previousAssetId.current === assetId) return;
    previousAssetId.current = assetId;
    setSelectedCalibration({});
  }, [assetId]);
  return (
    <CalibrationPanel
      mutateDeleteCalibration={noop}
      isDeletingCalibration={false}
      isLoadingCreation={false}
      mutateEdit={noop}
      isLoadingEdit={false}
      mutateAddCertificate={noop}
      isLoadingAddCertificate={false}
      mutateDeleteCertificate={noop}
      isLoadingDeleteCertificate={false}
      selectedCalibration={selectedCalibration}
      setSelectedCalibration={setSelectedCalibration}
      form={{}}
      openEdit={false}
      setOpenEdit={noop}
      openCreateCertificate={false}
      setOpenCreateCertificate={noop}
      error={{}}
      setError={noop}
      isMobile={false}
      checagem={false}
      debouncedSearch=""
      assetId={assetId}
      selectedCalibrationId={selectedCalibrationId}
    />
  );
}

const renderPanel = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('CalibrationPanel - seleção originada pela busca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seleciona exatamente a calibração antiga indicada pelo backend', async () => {
    renderPanel(<Harness assetId={7} selectedCalibrationId={31} />);

    await waitFor(() => {
      expect(screen.getByTestId('preview-calibration')).toHaveTextContent('31');
    });
  });

  it('não altera a seleção normal quando não há match de certificado', () => {
    renderPanel(
      <Harness
        assetId={7}
        selectedCalibrationId={null}
        initialCalibration={mockCalibrationsByAsset[7][0]}
      />
    );

    expect(screen.getByTestId('preview-calibration')).toHaveTextContent('50');
  });

  it('seleciona a calibração correta depois de trocar de instrumento', async () => {
    const { rerender } = renderPanel(
      <Harness assetId={7} selectedCalibrationId={31} />
    );
    await waitFor(() => {
      expect(screen.getByTestId('preview-calibration')).toHaveTextContent('31');
    });

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <Harness assetId={8} selectedCalibrationId={44} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('preview-calibration')).toHaveTextContent('44');
    });
  });
});
