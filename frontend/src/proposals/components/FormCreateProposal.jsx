import {
  TextField,
  Button,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dialog,
  Typography,
} from '@mui/material';
import { verifyError } from '../../utils/error';
import VirtualizedInstrumentAutocomplete from './VirtualizedInstrumentAutocomplete';
import InstrumentServiceSelectionTable from './InstrumentServiceSelectionTable';
import ClientAutocomplete from './ClientAutocomplete';
import useResponsive from '../../theme/hooks/useResponsive';

function FormCreateProposal(props) {
  const {
    onClose,
    open,
    user,
    mutateCreateProposal,
    isLoadingCreateProposal,
    formCreateProposal,
    error,
    setError,
  } = props;
  
  const instruments = formCreateProposal?.watch("instrumentos");
  const client = formCreateProposal?.watch('cliente');
  const isMobile = useResponsive('down', 'md');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="xl"
    >
      <DialogTitle>Criar novo pedido de calibração</DialogTitle>
      <DialogContent>
        {user?.admin && (
          <ClientAutocomplete
            user={user}
            value={client || null}
            onChange={(event, newValue) => { verifyError("cliente", error, setError); formCreateProposal?.setValue('cliente', newValue); }}
            error={!!error['cliente']?.length}
            helperText={!!error['cliente']?.length && error['cliente'][0]}
            sx={{ my: 2 }}
          />
        )}

        <VirtualizedInstrumentAutocomplete
          clientId={user?.admin ? client?.id : user?.cliente}
          value={instruments}
          onChange={(event, newValue) => {
            verifyError("instrumentos", error, setError);
            // Transform to new format with default selections
              const formattedInstruments = newValue?.map(inst => ({
              id: inst.id,
              service_kind: 'calibracao',
              local: 'P',
              ...inst, // Keep original instrument data
            })) || [];
            formCreateProposal?.setValue('instrumentos', formattedInstruments);
          }}
          error={!!error['instrumentos']?.length}
          helperText={!!error['instrumentos']?.length && error['instrumentos'][0]}
          label={user?.admin ? "Instrumentos do cliente" : "Instrumentos"}
          placeholder="Pesquisar instrumento"
          sx={{ my: 2 }}
        />
        
        {instruments && instruments.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Configurar serviços para cada instrumento:
            </Typography>
            <InstrumentServiceSelectionTable
              instruments={instruments}
              onChange={(updatedInstruments) => {
                formCreateProposal?.setValue('instrumentos', updatedInstruments);
              }}
              onRemove={(instrumentId) => {
                const updated = instruments.filter(inst => inst.id !== instrumentId);
                formCreateProposal?.setValue('instrumentos', updated);
              }}
              errors={error}
            />
          </>
        )}
        
        <TextField
          type="text"
          multiline
          name="informacoesAdicionais"
          label="Informações adicionais"
          placeholder="Informações adicionais"
          fullWidth
          {...formCreateProposal.register("informacoesAdicionais")}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ mt: 3, mb: 2 }} >
        <Button onClick={() => { onClose(); formCreateProposal.reset() }}>Cancelar</Button>
        <Button 
          onClick={() => mutateCreateProposal(formCreateProposal.getValues())} 
          variant="contained"
        >
          Enviar proposta
        </Button>

        {isLoadingCreateProposal && <CircularProgress />}
      </DialogActions>
    </Dialog>
  );
}

export default FormCreateProposal