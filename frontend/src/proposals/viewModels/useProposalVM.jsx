import { useState } from 'react'
import useResponsive from '../../theme/hooks/useResponsive';
import useProposal from '../hooks/useProposal';
import { useNavigate, useParams } from 'react-router';
import useAuth from '../../auth/hooks/useAuth';
import useProposalMutations from '../hooks/useProposalMutations';

const useProposalVM = () => {
  const [edit, setEdit] = useState(false);
  const [elaborateOpen, setElaborateOpen] = useState(false);
  const [openBillingApprovel, setOpenBillingApprovel] = useState(false);
  const [openSendEmail, setOpenSendEmail] = useState(false);
  const { id, idClient } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate()

  const { 
    deleteOrder, 
    isDeleting,
    removeInstrumentProposal,
    isRemoving,
    sendProposalToEmail, 
    isLoadingSendProposal,
    aproveProposal, 
    isLoadingAproveProposal,
    refuseProposal, 
    isLoadingRefuseProposal,
    addInstrumentProposal,
    isLoadingAdd,
    elaborateProposal,
    isLoadingElaborateProposal,
    isSuccessElaborate,
    isApprovingBilling,
    approveBilling,
  } = useProposalMutations(null, null, null, id)
  
  const deleteOrderAndNavigate = () => {
    deleteOrder([id])
    navigate('/admin/propostas', { replace: true });
  }

  const {
    proposal, 
    errorProposal, 
    isLoadingProposal, 
  } = useProposal(id, idClient,);

  const isMobile = useResponsive('down', 'md');

  return {
    isMobile,
    removeInstrumentProposal,
    isRemoving,
    proposal, 
    errorProposal, 
    isLoadingProposal, 
    sendProposalToEmail, 
    isLoadingSendProposal,
    aproveProposal, 
    isLoadingAproveProposal,
    refuseProposal, 
    isLoadingRefuseProposal,
    elaborateOpen,
    setElaborateOpen,
    user,
    edit,
    setEdit,
    deleteOrderAndNavigate,
    addInstrumentProposal,
    isLoadingAdd,
    elaborateProposal,
    isLoadingElaborateProposal,
    isSuccessElaborate,
    isDeleting,
    openBillingApprovel, 
    setOpenBillingApprovel,
    isApprovingBilling,
    approveBilling,
    openSendEmail, 
    setOpenSendEmail,
  }
}

export default useProposalVM