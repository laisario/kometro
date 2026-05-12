import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { permissionLabel } from "../../utils/permission";
import RemoveUserDialog from "../../clients/components/RemoveUserDialog";
import { useMutation, useQueryClient } from "react-query";
import { axios } from "../../api";
import { enqueueSnackbar } from "notistack";
import { getErrorMessage } from "../../utils/error";

export default function UserList({ users, isFetching, currentUser, clienteId, isAdmin }) {
  const [removingUser, setRemovingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const filteredUsers = users?.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    const name = (u?.firstName || u?.username || "").toLowerCase();
    const email = (u?.username || "").toLowerCase();
    const groups = u?.groups?.map((g) => g.name).join(" ").toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower) || groups.includes(searchLower);
  });

  const { mutate: removeUser, isLoading: isRemovingUser } = useMutation({
    mutationFn: async ({ userId }) => {
      await axios.delete(`/clientes/${clienteId}/usuarios/${userId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-staff'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      enqueueSnackbar('Usuário removido', {
        variant: 'success',
        autoHideDuration: 2000
      });
      setRemovingUser(null);
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    }
  });

  const handleRemoveUser = () => {
    if (removingUser && clienteId) {
      removeUser({ userId: removingUser.id });
    }
  };

  const canRemove = (user) => {
    if (!clienteId) return false;
    if (user?.id === currentUser?.id) return false;
    return true;
  };

  if (isFetching) {
    return (
      <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 2, gap: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Usuários com acesso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin 
              ? "Lista de usuários administradores do sistema"
              : "Lista de usuários deste cliente"}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 250 }}
        />
      </Box>

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Grupo de acesso</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filteredUsers || filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário encontrado"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {u?.firstName || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      {u?.username ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {u?.groups?.length ? (
                        u?.groups?.map((g) => (
                          <Chip
                            key={g.id}
                            label={permissionLabel[g.name] ?? g.name}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Chip label="Sem grupo" size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {canRemove(u) && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setRemovingUser(u)}
                        title={`Remover ${u?.username}`}
                      >
                        <PersonRemoveIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <RemoveUserDialog
        open={!!removingUser}
        user={removingUser}
        onClose={() => setRemovingUser(null)}
        onConfirm={handleRemoveUser}
        isRemoving={isRemovingUser}
      />
    </Paper>
  );
}