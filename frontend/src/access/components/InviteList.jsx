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
} from "@mui/material";
import useInvites from "../hooks/useInvites";
import Label from "../../components/label";


export default function InviteList() {
  const { invites, isFetching } = useInvites()

  return (
    <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Convites criados
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Aqui estão os convites que você já gerou para funcionários.
      </Typography>

      <List
        sx={{
          maxHeight: "60vh",
          overflowY: "auto",
          pr: 1,
        }}
      >
        {isFetching
          ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
          : invites?.map((invite, idx) => (
            <Box key={idx}>
              <ListItem
                secondaryAction={
                  <Label
                    children={invite?.usado ? "Usado" : "Não usado"}
                    color={invite?.usado ? "success" : "error"}
                  />
                }
              >
                <ListItemText
                  primary={`Grupo: ${invite?.grupo?.name}`}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Criado por: {invite?.criadoPor?.firstName || invite?.criadoPor?.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expira em: {new Date(invite?.expiraEm).toLocaleString("pt-BR")}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {idx < invites?.results?.length - 1 && <Divider />}
            </Box>
        ))}
      </List>
    </Paper>
  );
}