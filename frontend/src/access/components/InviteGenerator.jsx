import React, { useState } from 'react'
import { Box, Button, CircularProgress, IconButton, InputAdornment, MenuItem, Paper, TextField, Tooltip, Typography } from '@mui/material'
import useGroups from '../hooks/useGroups';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import { enqueueSnackbar } from 'notistack';
import useInvitesMutations from '../hooks/useInvitesMutations';
import { permissionLabel } from '../../utils/permission';

function InviteGenerator() {
  const [grupo, setGrupo] = useState('');
  const [conviteUrl, setConviteUrl] = useState("");
  const { groups, isFetching } = useGroups()
  const { createInviteMutation } = useInvitesMutations(grupo, setConviteUrl)

  const handleCopy = async () => {
    if (conviteUrl) {
      await navigator.clipboard.writeText(conviteUrl);
      enqueueSnackbar("Link copiado com sucesso!", {
        variant: 'info'
      });
    }
  };


  return (
    <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Criar link de convite
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Crie um link para enviar ao funcionário. Ao acessar esse link, ele
        poderá criar seu usuário e acessar o painel da empresa.
      </Typography>

      <TextField
        select
        fullWidth
        label="Selecione o grupo de acesso"
        value={grupo}
        onChange={(e) => setGrupo(e.target.value)}
        margin="normal"
      >
        {isFetching
          ? (
            <MenuItem sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CircularProgress size="30px" />
            </MenuItem>
          )
          : groups?.results?.map((group) => (
          <MenuItem key={group?.id} value={group?.id}>
            {permissionLabel[group?.name]}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={!grupo}
        onClick={createInviteMutation}
      >
        Gerar Link
      </Button>

      {true && (
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Link gerado:
          </Typography>
          <TextField
            fullWidth
            value={conviteUrl}
            InputProps={{ readOnly: true }}
            margin="normal"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={'Copiar link'}>
                      <IconButton onClick={handleCopy}>
                        <CopyAllIcon color='primary' />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="caption">
            Link válido por 15 dias
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default InviteGenerator