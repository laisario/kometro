import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  Stack,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import { permissionLabel } from "../../utils/permission";
import useClientMutations from "../hooks/useClientMutations";
import RemoveUserDialog from "./RemoveUserDialog";
import InviteUserDialog from "./InviteUserDialog";
import CreateClient from "./CreateClient";
import InviteList from "../../access/components/InviteList";

const ClientInformation = ({ data, isMobile, user: currentUser }) => {
  const [removingUser, setRemovingUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const empresa = data?.empresa;
  const endereco = data?.endereco;
  const usuarios = data?.usuarios ?? [];
  const clienteId = data?.id;
  const isAdmin = currentUser?.admin;

  const { removeUser, isRemovingUser } = useClientMutations();

  const handleRemoveUser = () => {
    if (removingUser) {
      removeUser({ clienteId, userId: removingUser.id });
      setRemovingUser(null);
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 2,
      }}
    >
      {/* Empresa Card */}
      <Card
        variant="outlined"
        sx={{
          width: isMobile ? "100%" : "auto",
          minWidth: isMobile ? "auto" : "280px",
          flex: isMobile ? "none" : 1,
          height: 280,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardHeader
          avatar={<BusinessIcon color="primary" />}
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              Empresa
            </Typography>
          }
          action={
            isAdmin ? (
              <IconButton
                size="small"
                onClick={() => setEditDialogOpen(true)}
                title="Editar cliente"
              >
                <EditIcon />
              </IconButton>
            ) : null
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ flex: 1, pt: 0, overflowY: "auto" }}>
          <Stack spacing={1}>
            {empresa?.razaoSocial && (
              <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                <strong>Razão Social:</strong> {empresa?.razaoSocial}
              </Typography>
            )}
            {empresa?.cnpj && (
              <Typography variant="body2">
                <strong>CNPJ:</strong> {empresa?.cnpj}
              </Typography>
            )}
            {empresa?.nomeFantasia && (
              <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                <strong>Nome fantasia:</strong> {empresa?.nomeFantasia}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Filial:</strong> {empresa?.filial ?? "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Inscrição Estadual:</strong>{" "}
              {empresa?.isento ? "Isento" : empresa?.ie || "Não informado"}
            </Typography>
            {data?.criterioFrequenciaPadrao && (
              <Typography variant="body2">
                <strong>Critério frequência:</strong>{" "}
                {data?.criterioFrequenciaPadrao === "C" ? "Tempo de calendário" : "Tempo de serviço"}
              </Typography>
            )}
            {endereco?.enderecoCompleto && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="body2"
                  sx={{ wordBreak: "break-word", lineHeight: 1.4 }}
                >
                  <strong>Endereço:</strong> {endereco?.enderecoCompleto}
                </Typography>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Estatísticas Card */}
      <Card
        variant="outlined"
        sx={{
          width: isMobile ? "100%" : "auto",
          minWidth: isMobile ? "auto" : "240px",
          flex: isMobile ? "none" : 1,
          height: 280,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardHeader
          avatar={<BarChartIcon color="secondary" />}
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              Estatísticas
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ flex: 1, pt: 0, overflowY: "auto" }}>
          <Stack spacing={1.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="error" fontWeight={600}>
                Vencidos
              </Typography>
              <Typography variant="h6" color="error">
                {data?.instrumentosVencidos ?? 0}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="success.main" fontWeight={600}>
                Em dia
              </Typography>
              <Typography variant="h6" color="success.main">
                {data?.instrumentosEmDia ?? 0}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="primary.main" fontWeight={600}>
                Cadastrados
              </Typography>
              <Typography variant="h6" color="primary.main">
                {data?.instrumentosCadastrados ?? 0}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography color="warning.main" fontWeight={600}>
                Propostas pendentes
              </Typography>
              <Typography variant="h6" color="warning.main">
                {data?.propostasAguardandoAprovacao ?? 0}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Usuários Card */}
      <Card
        variant="outlined"
        sx={{
          width: isMobile ? "100%" : "auto",
          minWidth: isMobile ? "auto" : "280px",
          flex: isMobile ? "none" : 1,
          height: 280,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardHeader
          title={
             <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0 } }}
          >
            <Tab label="Usuários" sx={{ minHeight: 36 }} />
            <Tab label="Acessos" sx={{ minHeight: 36 }} />
          </Tabs>
          }
          action={
            isAdmin ? (
              <IconButton
                size="small"
                onClick={() => setInviteDialogOpen(true)}
                title="Convidar novo usuário"
              >
                <PersonAddIcon />
              </IconButton>
            ) : null
          }
          sx={{ pb: 0 }}
        />
        <CardContent
          sx={{
            flex: 1,
            pt: 1,
            overflowY: "auto",
            overflowX: "hidden",
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#c1c1c1",
              borderRadius: "4px",
            },
          }}
        >
          {activeTab === 0 ? (
          <Box>
            {usuarios?.length ? (
              <Stack>
                {usuarios?.map((u, idx) => (
                  <Box key={idx}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center",justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {u?.firstName || "Usuário sem nome"}
                      </Typography>
                      {isAdmin && u?.id !== currentUser?.id && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setRemovingUser(u)}
                          title={`Remover acesso de ${u?.username}`}
                        >
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ wordBreak: "break-all" }}
                    >
                      {u?.username ?? "—"}
                    </Typography>
                    <Box mt={0.5} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {u?.groups?.length ? (
                        u?.groups?.map((g) => (
                          <Chip
                            key={g.id}
                            label={permissionLabel[g.name] ?? "—"}
                            size="small"
                          />
                        ))
                      ) : (
                        <Chip label="Sem grupo" size="small" />
                      )}
                    </Box>
                    {idx < usuarios?.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2">Nenhum usuário cadastrado</Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <InviteList 
              clienteId={clienteId} 
              showTitle={false} 
              clientView
              sx={{ p: 0, boxShadow: 'none' }}
            />
          </Box>
          )}
        </CardContent>
      </Card>

      {/* Remove User Dialog */}
      <RemoveUserDialog
        open={!!removingUser}
        user={removingUser}
        onClose={() => setRemovingUser(null)}
        onConfirm={handleRemoveUser}
        isRemoving={isRemovingUser}
      />

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        overrideClienteId={clienteId}
        isAdmin={isAdmin}
      />

      {/* Edit Client Dialog */}
      <CreateClient
        open={editDialogOpen}
        onClose={handleEditClose}
        clientData={data}
      />
    </Box>
  );
};

export default ClientInformation;
