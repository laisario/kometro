import React from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import Iconify from '../../components/Iconify';
import { fDate } from '../../utils/formatTime';
import Assets from '../components/Assets';
import AdditionalInformation from '../components/AdditionalInformation';
import InformationProposal from '../components/InformationProposal';
import FormElaborate from '../components/FormElaborate';
import useProposalVM from '../viewModels/useProposalVM';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import Loading from '../../components/Loading'
import MenuButton from '../components/MenuButton'
import BillingApprovalForm from '../components/BillingApprovalForm';
import SendEmailForm from '../components/SendEmailForm';
import useAuth from '../../auth/hooks/useAuth';
import { NO_PERMISSION_ACTION } from '../../utils/messages';


function ProposalDetailsPage() {
  const {
    isMobile,
    proposal,
    removeInstrumentProposal,
    elaborateOpen,
    setElaborateOpen,
    user,
    setEdit,
    aproveProposal,
    refuseProposal,
    deleteOrderAndNavigate,
    sendProposalToEmail,
    addInstrumentProposal,
    elaborateProposal,
    isSuccessElaborate,
    isRemoving,
    isLoadingSendProposal,
    isLoadingElaborateProposal,
    isDeleting,
    isLoadingAdd,
    isLoadingAproveProposal,
    isLoadingRefuseProposal,
    isLoadingProposal,
    openBillingApprovel, 
    setOpenBillingApprovel,
    isApprovingBilling,
    approveBilling,
    openSendEmail, 
    setOpenSendEmail,
  } = useProposalVM();
  const theme = useTheme()
  const { hasCreatePermission } = useAuth()
  return (
    <>
      <Helmet>
        <title>Proposta | Kometro </title>
      </Helmet>
      {isLoadingProposal 
        ? <Loading />
        : (
        <Container>
        <Stack 
          direction={isMobile ? "column" : "row"} 
          alignItems={isMobile ? "flex-start" : "center"} 
          justifyContent="space-between" 
          mb={5}
        >
          <Box direction="column">
            {!!proposal?.numero &&
              <Typography variant="h4" gutterBottom>
                Proposta número: {proposal?.numero}
              </Typography>
            }
            {user?.admin ? 
              <Typography variant="h6" gutterBottom>
                {proposal?.cliente?.empresa?.razaoSocial}
              </Typography>
              : !!proposal?.dataCriacao &&
              <Typography variant="h6" gutterBottom>
                {fDate(proposal?.dataCriacao)}
              </Typography>}
          </Box>

          {user?.admin ? (
            <Box display="flex" gap={2} mt={isMobile ? 2 : 0}>
              <Tooltip title="Enviar proposta para email">
                <Button 
                  variant="contained" 
                  color="secondary"
                  size='small'
                  disabled={proposal?.status === "E"} 
                  onClick={() => setOpenSendEmail(true)} 
                  endIcon={
                    isLoadingSendProposal 
                      ? <CircularProgress size='20px' color="inherit" /> 
                      : <ForwardToInboxIcon />
                  }
                >
                  Enviar proposta por email
                </Button>
              </Tooltip>

              <MenuButton 
                isDeleting={isDeleting} 
                proposal={proposal}
                isLoadingElaborateProposal={isLoadingElaborateProposal}
                deleteOrderAndNavigate={deleteOrderAndNavigate}
                setEdit={setEdit}
                setElaborateOpen={setElaborateOpen}
                setOpenBillingApprovel={setOpenBillingApprovel}
                isApprovingBilling={isApprovingBilling}
              />
            </Box>
          ) : proposal?.status === "AA" && (
            <Box display='flex'>
              <Tooltip title={hasCreatePermission ? "Clique para aprovar a proposta" : NO_PERMISSION_ACTION}>
                <span>
                  <Button
                    variant="contained"
                    disabled={proposal?.status !== "AA" || !hasCreatePermission}
                    sx={{ marginX: 2 }}
                    onClick={() => aproveProposal()}
                    startIcon={
                      isLoadingAproveProposal 
                      ? <CircularProgress size='20px' color="inherit" /> 
                      : <Iconify icon="eva:checkmark-fill" />
                    }
                    >
                    Aprovar proposta
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={hasCreatePermission ? "Clique para reprovar a proposta" : NO_PERMISSION_ACTION}>
                <span>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={proposal?.status !== "AA" || !hasCreatePermission}
                    onClick={() => refuseProposal()}
                    startIcon={isLoadingRefuseProposal
                      ? <CircularProgress size='20px' color="inherit" /> 
                        : <Iconify icon="ph:x-bold" />
                    }
                  >
                    Reprovar proposta
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}
        </Stack>

        <FormElaborate
          open={elaborateOpen}
          data={proposal}
          setElaborate={setElaborateOpen}
          elaborateProposal={elaborateProposal}
          isLoadingElaborateProposal={isLoadingElaborateProposal}
          isSuccessElaborate={isSuccessElaborate}
        />

        <BillingApprovalForm
          open={openBillingApprovel}      
          onClose={() => setOpenBillingApprovel(false)}
          isMobile={isMobile}
          isApprovingBilling={isApprovingBilling}
          approveBilling={approveBilling}
          proposal={proposal}
        />

        <SendEmailForm 
          open={openSendEmail}
          onClose={() => setOpenSendEmail(false)}
          clienteEmail={proposal?.cliente?.usuario?.username}
          sendProposalToEmail={sendProposalToEmail}
        />

        <Paper sx={{ padding: 4 }}>
          {proposal?.status === "E" 
            ? <Box p={1} bgcolor={theme?.palette?.info?.lighter} borderRadius={1}  display="flex" flexDirection="row" alignItems="center" gap={1}>
                <Avatar variant='rounded' sx={{width: 30, height: 30, backgroundColor: theme?.palette?.info?.light}}>
                  <HourglassBottomIcon fontSize='small' />
                </Avatar>
                <Typography variant='body2' color={theme?.palette?.info?.dark}>
                  <b>{user?.admin ? 'O cliente fez uma solicitação!' : 'Recebemos sua solicitação!'}</b>
                  {user?.admin 
                    ? ' Complete as informações para que ele possa revisar.'
                    : ' A equipe está preenchendo os detalhes da proposta. Assim que estiver pronta, você poderá visualizá-la aqui.' 
                  }
                </Typography> 
            </Box>
            : (
            <InformationProposal
              data={proposal}
              isMobile={isMobile}
              admin={user?.admin}
            />
          )}
          <Assets
            data={proposal}
            addInstrumentProposal={addInstrumentProposal}
            isLoadingAdd={isLoadingAdd}
            isMobile={isMobile}
            admin={user?.admin}
            removeInstrumentProposal={removeInstrumentProposal}
            isRemoving={isRemoving}
          />
          {proposal?.informacoesAdicionais && <AdditionalInformation data={proposal} />}
        </Paper>
        </Container>
      )}
    </>
  )
}

export default ProposalDetailsPage
