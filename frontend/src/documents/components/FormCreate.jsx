import { useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useForm, useWatch } from 'react-hook-form';
import useProcedures from '../hooks/useProcedures';
import useUsers from '../../auth/hooks/useUsers';
import { availableFormats } from '../../utils/documents';
import useResponsive from '../../theme/hooks/useResponsive';
import useClient from '../../clients/hooks/useClient';
import useAuth from '../../auth/hooks/useAuth';
import useUserWithPermission from '../hooks/useUserWithPermission';

export default function FormCreate(props) {
  const { 
    open, 
    setOpen, 
    mutateCreate, 
    error, 
    isCreating, 
    setError,
    form,
    handleClose,
    handleCloseAndClean,
  } = props;

  const isMobile = useResponsive('down', 'md');
  const { procedures } = useProcedures();
  const { user } = useAuth();
  const { client } = useClient(user?.cliente || null)

  const handleChange = (event) => {
    const { name, files } = event.target;
    if (error['arquivo']) setError((prevError) => delete prevError?.arquivo)
    if (name === 'arquivo') {
      form.setValue("arquivo", files[0]);
    }
  };
    
  const {
    status,
    codigo,
    identificador,
    titulo,
    dataValidade,
    elaborador,
    frequencia,
    arquivo,
  } = useWatch({ control: form.control })
  const { usersWithPermission } = useUserWithPermission(client?.usuarios)

  
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Dialog
          open={open}
          onClose={handleClose}
          PaperProps={{
            component: 'form',
            onSubmit: async (event) => {
              event.preventDefault();
              mutateCreate({
                codigo,
                identificador,
                titulo,
                status,
                dataValidade: dayjs(dataValidade).format('YYYY-MM-DD') || null,
                criador: elaborador,
                frequencia,
                arquivo,
              });
            },
          }}
        >
          <DialogTitle>Criar novo documento</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                  <TextField
                    autoFocus
                    select
                    {...form.register("codigo", {
                      onChange: (e) => {if (error?.codigo) setError(null)},
                    })}
                    margin="dense"
                    id="codigo"
                    name="codigo"
                    label="Código"
                    fullWidth
                    error={!!error?.codigo}
                    helperText={!!error?.codigo && error?.codigo}
                  >
                    {procedures?.map(({ codigo, id }) => (
                      <MenuItem key={id} value={id}>
                        {codigo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    autoFocus
                    {...form.register("identificador", {
                      onChange: (e) => {if (error?.identificador) setError(null)},
                    })}
                    margin="dense"
                    id="identificador"
                    name="identificador"
                    label="Identificador"
                    fullWidth
                    error={!!error?.identificador}
                    helperText={!!error?.identificador && error?.identificador}
                  />
                </Grid>
                <Grid item xs={isMobile ? 12 : 6}>
                  <TextField
                    autoFocus
                    {...form.register("titulo", {
                      onChange: (e) => {if (error?.titulo) setError(null)},
                    })}
                    id="titulo"
                    name="titulo"
                    label="Título"
                    fullWidth
                    error={!!error?.titulo}
                    helperText={!!error?.titulo && error?.titulo}
                  />
                </Grid>
                <Grid item xs={isMobile ? 12 : 6}>
                  <FormControl fullWidth>
                    <InputLabel id="elaborador">Elaborador</InputLabel>
                    <Select
                      autoFocus
                      {...form.register("elaborador", {
                        onChange: (e) => {if (error?.elaborador) setError(null)},
                      })}
                      value={elaborador}
                      margin="dense"
                      id="elaborador"
                      name="elaborador"
                      label="elaborador"
                      fullWidth
                      error={!!error?.elaborador}
                      helperText={!!error?.elaborador && error?.elaborador}
                    >
                      {usersWithPermission?.map(({ username, id }) => (
                        <MenuItem key={id} value={id}>
                          {username}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    autoFocus
                    id="frquencia"
                    label="Frequencia (em anos)"
                    name="frequencia"
                    variant="outlined"
                    type="number"
                    {...form.register("frequencia", {
                      onChange: (e) => {if (error?.frequencia) setError(null)},
                    })}
                    fullWidth
                    error={!!error?.frequencia}
                    helperText={!!error?.frequencia && error?.frequencia}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    value={dataValidade ? dayjs(dataValidade) : null}
                    onChange={newValue => {
                      if (error?.data_validade) setError(null)
                      form.setValue("dataValidade", newValue)
                    }}
                    label="Validade"
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        error: !!error?.data_validade,
                        helperText: !!error?.data_validade && error?.data_validade,
                      },
                    }}
                  />
                </Grid>
            </Grid>
            <FormControl
              sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 2, 
                mt: 2, 
                mb: 2
              }}
              error={!!error?.status}
              helperText={!!error?.status && error?.status}
            >
              <FormLabel id="status">Status: </FormLabel>
              <RadioGroup row aria-labelledby="aprovacao">
                <FormControlLabel
                  value="V"
                  control={
                    <Radio
                      checked={status === 'V'}
                      {...form.register("status", {
                        onChange: (e) => {if (error?.status) setError(null)},
                      })}
                    />
                  }
                  label="Vigente"
                />
                <FormControlLabel
                  value="O"
                  control={
                    <Radio
                      checked={status === 'O'}
                      {...form.register("status", {
                        onChange: (e) => {if (error?.status) setError(null)},
                      })}
                    />
                  }
                  label="Obsoleto"
                />
                <FormControlLabel
                  value="C"
                  control={
                    <Radio
                      checked={status === 'C'}
                      {...form.register("status", {
                        onChange: (e) => {if (error?.status) setError(null)},
                      })}
                    />
                  }
                  label="Cancelado"
                />
                {!!error?.status && <FormHelperText>{error?.status}</FormHelperText>}
              </RadioGroup>
            </FormControl>
            <FormControl
              error={!!error?.arquivo}
              helperText={!!error?.arquivo && error?.arquivo}
              sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap'}}
            >
              <FormLabel id="anexo" sx={{ mr: 2 }}>Anexo: </FormLabel>
              <Button component="label" color="info" variant="contained" startIcon={<CloudUploadIcon />}>
                arquivo
                <input
                  style={{ display: 'none' }}
                  id="upload-btn"
                  name="arquivo"
                  type="file"
                  {...form.register("arquivo", {
                    onChange: (e) => {if (error?.arquivo) setError(null)},
                  })}
                  onChange={handleChange}
                />
              </Button>
              {!!arquivo &&
                <Button
                  size="small"
                  href={
                    !!arquivo && arquivo instanceof File
                      ? URL.createObjectURL(arquivo)
                      : arquivo
                  }
                  target="_blank"
                  component="a"
                  variant="outlined"
                >
                  Ver arquivo
                </Button>
              }
              <Typography variant='body2' fontSize={12} color="primary">{availableFormats}</Typography>
              {!!error?.arquivo && <FormHelperText>{error?.arquivo}</FormHelperText>}
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Grid container justifyContent="space-between">
              <Grid item>
                <Button onClick={handleCloseAndClean}>Cancelar</Button>
              </Grid>
              <Grid item>
                {isCreating 
                  ? <CircularProgress /> 
                  : (
                  <Button
                    size="large" 
                    variant="contained" 
                    type="submit"
                  >
                    Criar documento
                  </Button>
              )}
              </Grid>
            </Grid>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </>
  );
}