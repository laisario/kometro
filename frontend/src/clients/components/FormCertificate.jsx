import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, Link, Paper, FormLabel, Box } from '@mui/material';
import React, { useRef } from 'react'
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { truncateString } from '../../utils/formatString';


function FormCertificate(props) {
  const { 
    open, 
    handleClose, 
    calibration, 
    mutateAddCertificate,
    checagem,
  } = props;
  const ref = useRef(null)
  const form = useForm({
    defaultValues: {
      arquivo: null,
      numeroDoCertificado: '',
    }
  })

  const { fields: anexos, append, remove, } = useFieldArray({
    control: form?.control,
    name: "anexos",
  });

  const {
    arquivo,
    numeroDoCertificado
  } = useWatch({ control: form?.control })

  const handleChangeAnexo = (event) => {
    if (!event.target.files.length) return
    append({ anexo: event.target.files[0] })
  }

  const handleRemoveAttachment = async (index) => {
    remove(index)
  }

  const handleChange = (event) => {
    const { name, files } = event.target;
    if (name === 'arquivo') {
      form.setValue("arquivo", files[0]);
    }
  }

  const save = () => {
    mutateAddCertificate({id: calibration?.id, arquivo, numero: numeroDoCertificado, anexos})
  }


  const handleCloseAndClean = () => {
    form?.reset();
    remove();
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          save();
          handleCloseAndClean();
        },
      }}
    >
      <DialogTitle>{checagem ? 'Adicione um documento' : 'Adicione um certificado'}</DialogTitle>
      <DialogContent>
        {!checagem && <TextField
          autoFocus
          required
          margin="dense"
          id="numeroCertificado"
          label="Número do certificado"
          fullWidth
          size="small"
          {...form?.register("numeroDoCertificado")}
        />}
        <Box my={1}>
          <FormLabel sx={{ marginRight: 1 }} id="upload-btn">Certificado</FormLabel>
          <Button component="label" size="small" variant="contained" startIcon={<CloudUploadIcon />}>
            {checagem ? 'Enviar documento' : 'Enviar certificado'}
            <input
              style={{ display: 'none' }}
              id="upload-btn"
              name="arquivo"
              type="file"
              {...form?.register("arquivo")}
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
            >
              Ver arquivo: {arquivo?.name}
            </Button>
          }
        </Box>

        <Typography>Anexos</Typography>
        <Box display="flex" gap={2} sx={{width: '100%', overflow: 'auto'}}>
            <Paper onClick={() => ref?.current?.click()} sx={{ cursor: 'pointer', display: 'flex', flexShrink: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 100, width: 100 }} elevation={4}>
              <Typography color="gray" fontSize={72} lineHeight={0.75} mb={0} fontWeight={300}>+</Typography>
              <Typography color="gray" variant='caption'>Novo anexo</Typography>
              <input
                style={{ display: 'none' }}
                id="upload-btn"
                name="anexos"
                type="file"
                ref={ref}
                onChange={handleChangeAnexo}
              />
            </Paper>
            {anexos?.map((anexo, i) => <Paper key={anexo + i + 1} sx={{ textDecoration: "none", display: 'flex', flexShrink: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 100, width: 100 }} elevation={4}>
                <Link
                  href={
                      !!anexo?.anexo && anexo?.anexo instanceof File
                          ? URL.createObjectURL(anexo?.anexo)
                          : anexo?.anexo
                  }
                  target="_blank"
                  rel='noreferrer'
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <DescriptionIcon color='gray' fontSize="large" />
                  <Typography color="gray" variant='caption'>
                    {truncateString(anexo?.anexo?.name, 12)}
                  </Typography>
                </Link>
                <CloseIcon fontSize='small' color='gray' onClick={() => handleRemoveAttachment(i)} />
            </Paper>)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseAndClean}>Cancelar</Button>
        <Button variant='contained' type="submit">Salvar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormCertificate