import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { permissionLabel } from "../../utils/permission";
import RemoveUserDialog from "../../clients/components/RemoveUserDialog";
import { useMutation, useQueryClient } from "react-query";
import { axios } from "../../api";
import { enqueueSnackbar } from "notistack";
import { getApiErrorMessage } from "../../utils/error";

export default function UserList({
  users,
  isFetching,
  currentUser,
  clienteId,
  isAdmin,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  setPage,
}) {
  const [removingUser, setRemovingUser] = useState(null);
  const queryClient = useQueryClient();
  const userResults = users?.results || [];
  const totalUsers = users?.count || 0;

  const { mutate: removeUser, isLoading: isRemovingUser } = useMutation({
    mutationFn: async ({ userId }) => {
      console.debug('[ACCESS_USERS_DEACTIVATE_REQUEST]', {
        userId,
        clienteId,
        requestedByUserId: currentUser?.id,
      });
      await axios.delete(`/users/${userId}/`);
    },
    onSuccess: () => {
      if (userResults.length <= 1 && page > 0) {
        setPage(page - 1);
      }
      queryClient.invalidateQueries({ queryKey: ['access-users'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-staff'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      enqueueSnackbar('Usuário desativado', {
        variant: 'success',
        autoHideDuration: 2000
      });
      setRemovingUser(null);
    },
    onError: (error) => {
      console.error('[ACCESS_USERS_REMOVE_ERROR]', error);
      enqueueSnackbar(getApiErrorMessage(error, 'Não foi possível remover o acesso do usuário.'), {
        variant: 'error',
        autoHideDuration: 4000
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Usuários com acesso
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAdmin 
            ? "Lista de usuários administradores do sistema"
            : "Lista de usuários deste cliente"}
        </Typography>
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
            {userResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhum usuário encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              userResults.map((u) => (
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
                        title={`Remover acesso de ${u?.username}`}
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={totalUsers}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por páginas"
      />

      <RemoveUserDialog
        open={!!removingUser}
        user={removingUser}
        onClose={() => setRemovingUser(null)}
        onConfirm={handleRemoveUser}
        isRemoving={isRemovingUser}
        mode="deactivate-user"
      />
    </Paper>
  );
}
