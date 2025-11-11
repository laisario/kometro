import React from 'react'
import { useDocument } from '../hooks/useDocument'
import { useNavigate, useParams } from 'react-router';
import { status, statusColor } from '../../utils/documents';
import useAuth from '../../auth/hooks/useAuth';

function useDocumentVM() {
  const { id } = useParams();

  const {
    document,
    errorDocument,
    isLoadingDocument,
    openFormReview,
    setOpenFormReview,
    mutateCreateReview,
    formReview,
    handleCloseReview,
    error,
    setError,
    isCreatingReview,
    mutateApproveReview, 
    isLoadingApproveReview
  } = useDocument(id);

  const { user } = useAuth();
  const url = !!document?.arquivo && new URL(`${document?.arquivo}`);
  
  const splittedUrl = url?.pathname?.split('.');
  
  const fileType = !!splittedUrl?.length && splittedUrl[splittedUrl.length - 1];
  
  const revisoes = document?.revisoes;
  
  const navigate = useNavigate();

  return {
    document,
    errorDocument,
    isLoadingDocument,
    status,
    statusColor,
    openFormReview,
    setOpenFormReview,
    mutateCreateReview,
    user,
    fileType,
    revisoes,
    navigate,
    formReview,
    handleCloseReview,
    error,
    setError,
    isCreatingReview,
    mutateApproveReview, 
    isLoadingApproveReview
  }
}

export default useDocumentVM