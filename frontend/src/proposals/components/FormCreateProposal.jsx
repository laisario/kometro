import {
  TextField,
  Button,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dialog,
  Autocomplete,
  Typography,
} from '@mui/material';
import { verifyError } from '../../utils/error';
import VirtualizedInstrumentAutocomplete from './VirtualizedInstrumentAutocomplete';
import InstrumentServiceSelectionTable from './InstrumentServiceSelectionTable';

function FormCreateProposal(props) {
  const { 
    onClose, 
    open, 
    user,
    mutateCreateProposal,
    isLoadingCreateProposal,
    formCreateProposal,
    clients,
    isLoadingClients,
    error,
    setError,
  } = props;
  
  const instruments = formCreateProposal?.watch("instrumentos");
  const client = formCreateProposal?.watch('cliente');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
    >
      <DialogTitle>Criar novo pedido de calibração</DialogTitle>
      <DialogContent>
        {user?.admin && (
          <Autocomplete
            autoHighlight
            options={clients?.results || []}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            getOptionLabel={
              (client) => client?.empresa
            }
            loading={isLoadingClients}
            name="cliente"
            value={client || null}
            loadingText="Carregando..."
            noOptionsText="Sem resultados"
            onChange={(event, newValue) => {verifyError("cliente", error, setError); formCreateProposal?.setValue('cliente', newValue)}}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente"
                placeholder="Pesquisar cliente"
                helperText={!!error['cliente']?.length && error['cliente'][0]}
                error={!!error['cliente']?.length}
              />
            )}
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