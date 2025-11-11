import React, { useContext, useState, useMemo } from 'react'
import useResponsive from '../../theme/hooks/useResponsive';
import useAuth from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router';
import { statusColor, status } from '../../utils/documents';
import { axios } from '../../api';
import useDocuments from '../hooks/useDocuments';
import useDocumentMutations from '../hooks/useDocumentMutations';
import { isPastFromToday } from '../../utils/formatTime';


export const useDocumentsVM = () => {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [csvContent, setCsvContent] = useState(null);
  const [filter, setFilter] = useState(false);

  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'md');
  const { user } = useAuth();

  
  const {
    data,
    page,
    rowsPerPage,
    error,
    formFilter,
    form,
    setError,
    setOpen,
    open,
    setPage,
    setRowsPerPage,
  } = useDocuments();
  
  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseAndClean = () => {
    form.reset()
    setOpen(false);
  };

  const {
    mutateCreate,
    isCreating,
    isSuccessCreate,
    errorCreate,
    deleteDocumentos,
    isDeleting,
  } = useDocumentMutations(handleCloseAndClean, setError);



  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const expiredDocuments = useMemo(() =>  data?.results?.filter((document) =>
    isPastFromToday(document?.data_validade)
  ), [data]);

  const handleOpenForm = () => {
    setOpen(true);
  };

  const cleanSelectedDocuments = () => {
    setSelectedDocuments([])
  }

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data?.results?.map((n) => n.id);
      setSelectedDocuments(newSelected);
      return;
    }
    setSelectedDocuments([]);
  };

  const handleClick = (event, id) => {
    event?.stopPropagation()
    setSelectedDocuments((prevDocs) => selectedDocuments?.includes(id) 
    ? selectedDocuments?.filter(documentId => documentId !== id) 
    : [...prevDocs, id]);
  };

  const isSelected = (id) => selectedDocuments.indexOf(id) !== -1;

  const exportDocuments = async () => {
    try {
      const resposta = await axios.post('/documentos/exportar/', { documentos_selecionados: selectedDocuments });;
      if (resposta.status === 200) {
        setCsvContent(resposta?.data)
      } else {
        console.log('Xi status não foi 200')
      }
    } catch (error) {
      console.error('Erro ao enviar dados para o backend:', error);
    }
  };

  return {
    open,
    setOpen,
    csvContent,
    filter,
    setFilter,
    navigate,
    isMobile,
    user,
    handleOpenForm,
    handleSelectAllClick,
    handleClick,
    isSelected,
    exportDocuments,
    data,
    status,
    statusColor,
    deleteDocumentos,
    isDeleting,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    formFilter,
    mutateCreate,
    errorCreate,
    isCreating,
    isSuccessCreate,
    selectedDocuments,
    cleanSelectedDocuments,
    error,
    setError,
    form,
    handleClose,
    user,
    expiredDocuments,
    handleCloseAndClean
  }
}
