import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import useInvites from "../hooks/useInvites";
import Label from "../../components/label";
import { permissionLabel } from "../../utils/permission";
import { enqueueSnackbar } from "notistack";

export default function InviteList({ clienteId, showTitle = true, clientView = false, sx }) {
  const { invites, isFetching } = useInvites(clienteId)
  const handleCopy = async (url) => {
    if (url) {
      await navigator.clipboard.writeText(url);
      enqueueSnackbar("Link copiado!", { variant: "success" });
    }
  };

  return (
    <Paper elevation={clientView? 0 : 3} sx={{ p: clientView? 0 : 4, width: "100%", maxHeight: 400, display: 'flex', flexDirection: 'column', ...sx }}>
      {showTitle && (
        <>
          <Typography variant="h6" gutterBottom>
            Convites criados
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Aqui estão os convites que você já gerou para funcionários.
          </Typography>
        </>
      )}

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isFetching
          ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
          : invites?.length === 0
            ? <Typography variant="body2" color="text.secondary">Nenhum acesso gerado</Typography>
            : invites?.map((invite, idx) => (
                <ListItem sx={{px: 0}} key={idx}>
                  <ListItemText
                    primary={
                      <>
                        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                          <Typography variant="body2" fontWeight={600}>
                            {permissionLabel[invite?.grupo?.name] || invite?.grupo?.name || "Grupo"}
                          </Typography>
                          <Label
                            children={invite?.usado ? "Usado" : "Não usado"}
                            color={invite?.usado ? "success" : "error"}
                          />
                        </Box>
                        {invite?.conviteUrl && (
                          <TextField
                            value={invite?.conviteUrl}
                            fullWidth
                            size="small"
                            InputProps={{
                              readOnly: true,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip title="Copiar link">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleCopy(invite?.conviteUrl)}
                                    >
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              ),
                            }}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Criado por: {invite?.criadoPor?.firstName || invite?.criadoPor?.username || "Usuário desativado"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expira em: {new Date(invite?.expiraEm).toLocaleString("pt-BR")}
                        </Typography>
                        {idx < invites?.length - 1 && <Divider />}
                      </>
                    }
                    />
                </ListItem>
          ))}
      </List>
    </Paper>
  );
}
