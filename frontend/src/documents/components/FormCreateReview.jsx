import { 
  Button, 
  CircularProgress, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  FormHelperText, 
  FormLabel, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {  useWatch } from 'react-hook-form';
import useUsers from '../../auth/hooks/useUsers';
import { availableFormats } from '../../utils/documents';
import useAuth from '../../auth/hooks/useAuth';
import useClient from '../../clients/hooks/useClient';
import useUserWithPermission from '../hooks/useUserWithPermission';

function FormCreateReview(props) {
  const { 
    open, 
    idCreator, 
    mutateCreateReview, 
    isCreatingReview,
    form,
    handleClose,
    error,
    setError
  } = props;
  const { user } = useAuth();
  const { client } = useClient(user?.cliente || null)

  const {
    arquivo,
    aprovadores,
    alteracao,
    tipo
  } = useWatch({ control: form.control })
  
  const handleChange = (event) => {
    const { name, files } = event.target;
    if (error?.arquivo) setError(null)
    if (name === 'arquivo') {
      form.setValue("arquivo", files[0]);
    }
  };
  
  const usersWithoutCreator = client?.usuarios?.filter((user) => user.id !== idCreator)
  const { usersWithPermission } = useUserWithPermission(usersWithoutCreator)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: async (event) => {
          event.preventDefault();
          form.handleSubmit(mutateCreateReview)();
        },
      }}
    >
      <DialogTitle>{tipo === 'revalidar' ? 'Revalide o documento' : 'Revise o documento'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: "center", flexDirection: "column" }}>
        {isCreatingReview
          ? <CircularProgress />
          : (
            <Grid container display="flex" flexDirection="column" spacing={2}>
              <Grid item>
                <TextField
                  autoFocus
                  margin="dense"
                  id="alteracao"
                  name="alteracao"
                  multiline
                  type="text"
                  fullWidth
                  label={tipo === 'revalidar' ? 'Observações' : 'Alterações realizadas'}
                  {...form.register("alteracao", {
                    onChange: (e) => {if (error?.alteracao) setError(null)},
                  })}
                  error={!!error?.alteracao}
                  helperText={!!error?.alteracao && error?.alteracao}
                />
              </Grid>
              <Grid item>
                <FormControl fullWidth  error={!!error?.aprovadores}>
                  <InputLabel id="aprovadores">Aprovadores</InputLabel>
                  <Select
                    autoFocus
                    multiple
                    {...form.register("aprovadores", {
                      onChange: (e) => {if (error?.aprovadores) setError(null)},
                    })}
                    value={aprovadores}
                    margin="dense"
                    id="aprovadores"
                    name="aprovadores"
                    label="Aprovadores"
                    fullWidth
                  >
                    {usersWithPermission?.map(({ username, id }) => (
                      <MenuItem key={id} value={id}>
                        {username}
                      </MenuItem>
                    ))}
                  </Select>
                  {!!error?.aprovadores && <FormHelperText>{error?.aprovadores}</FormHelperText>}
                </FormControl>
              </Grid>
              {tipo === 'revisar' && (
                <Grid item>
                  <FormControl
                    error={!!error?.arquivo}
                    helperText={!!error?.arquivo && error?.arquivo}
                    sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap'}}
                  >
                    <FormLabel id="upload-btn">Documento {tipo === 'revalidar' ? 'revalidado:' : 'alterado:'}</FormLabel>
                    <Button component="label" size="small" variant="contained" startIcon={<CloudUploadIcon />}>
                      Enviar arquivo
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
                      component="a"
                        size="small"
                        href={
                          !!arquivo && arquivo instanceof File
                          ? URL.createObjectURL(arquivo)
                          : arquivo
                        }
                        target="_blank"
                        variant="outlined"
                        >
                        Ver arquivo
                      </Button>
                    }
                    <Typography variant='body2' fontSize={12} color="primary">{availableFormats}</Typography>
                  </FormControl>
                </Grid>
              )}
          </Grid>)
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        {!isCreatingReview && (
          <Button
            disabled={!(alteracao && aprovadores)} 
            type="submit"
          >
            {tipo === 'revalidar' ? 'Criar revalidação' : 'Criar revisão'}
          </Button>
          )}
      </DialogActions>
    </Dialog>
  );
}

export default FormCreateReview;