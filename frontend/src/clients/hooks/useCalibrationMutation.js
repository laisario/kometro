import { useEffect, useMemo, useState } from 'react';
import _, {debounce} from 'lodash';
import { useMutation, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import { axios, axiosForFiles } from '../../api';
import { enqueueSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';


const useCalibrationsMutations = (id, instrumento, checagem) => {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCalibration, setSelectedCalibration] = useState({});
  const [openForm, setOpenForm] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCreateCertificate, setOpenCreateCertificate] = useState(false);
  const [error, setError] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => { setSelectedCalibration({}) }, [instrumento])

  
  const handleSearchOS = debounce((value) => setDebouncedSearch(value));

  useEffect(() => { handleSearchOS(search) }, [search, handleSearchOS])
  
  const defaultValues = useMemo(() => ({
    local: selectedCalibration?.local ? selectedCalibration?.local : 'P',
    data: selectedCalibration?.data ? selectedCalibration?.data : null,
    ordemDeServico: selectedCalibration?.ordemDeServico ? selectedCalibration?.ordemDeServico : '',
    observacoes: selectedCalibration?.observacoes ? selectedCalibration?.observacoes : '',
    criterio: selectedCalibration?.resultados?.length && selectedCalibration?.resultados[0]?.criterio?.id ? selectedCalibration?.resultados[0]?.criterio?.id  : null,
    maiorErro: selectedCalibration?.resultados?.length && selectedCalibration?.resultados[0]?.maiorErro ? selectedCalibration?.resultados[0]?.maiorErro : null,
    incerteza: selectedCalibration?.resultados?.length && selectedCalibration?.resultados[0]?.incerteza ? selectedCalibration?.resultados[0]?.incerteza : null,
    preco: selectedCalibration?.preco ? selectedCalibration.preco : null,
    laboratorio: selectedCalibration?.laboratorio ? selectedCalibration.laboratorio : '',
    observacaoFornecedor: selectedCalibration?.observacaoFornecedor ? selectedCalibration.observacaoFornecedor : '',
  }), [selectedCalibration])
  
  const form = useForm({ defaultValues })
  const formCreate = useForm({ defaultValues: {
    local: 'P',
    data: null,
    ordemDeServico: '',
    observacoes: '',
    maiorErro: null,
    incerteza: null,
    criterio: null,
    arquivo: null,
    numero: '',
    anexos: [],
    preco: null,
    laboratorio: '',
    observacaoFornecedor: '',
  }})
  
  useEffect(() => {
    form?.reset(defaultValues)
  } , [defaultValues])
  
  const handleOpenForm = () => setOpenForm(true);
  
  const handleCloseForm = () => setOpenForm(false);
  
  const deleteRecord = async (id) => {
    await axios.delete(`/calibracoes/${id}/`);
  };
  
  const {
    mutate: mutateDeleteCalibration,
    isLoading: isDeletingCalibration,
  } = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibracoes'] })
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      setSelectedCalibration({});
      enqueueSnackbar(`${checagem ? 'Checagem' : 'Calibração'} deletada com sucesso!`, {
        variant: 'success'
      });
    },
    onError: (error) => {
      enqueueSnackbar(`Erro ao deletar ${checagem ? 'Checagem' : 'Calibração'}. Tente novamente!`, {
        variant: 'error'
      });
    },
  })


  const formatedData = (form) => ({
    ...form,
    data: form?.data && dayjs(form?.data)?.format('YYYY-MM-DD'),
  })

  const create = async (params) => {
    const data = formatedData(params?.form)
    const response = await axios.post(`/calibracoes/`, { ...data, instrumento, checagem,});
    return response.data;
  }

  const {
    mutate: mutateCreation,
    isLoading: isLoadingCreation,
    error: errorCreating,
  } = useMutation({
    mutationFn: create,
    onSuccess: async(createdCalibration) => {
      const {
        arquivo,
        numero,
        anexos
      } = formCreate.getValues();

      if (arquivo || !!numero || !!anexos?.length) {
        try {
          await mutateAddCertificateAsync({
            id: createdCalibration?.id,
            arquivo,
            numero,
            anexos,
          });
        } catch (e) {
          console.error('Erro ao adicionar certificado:', e);
        }
      }
  
      queryClient.invalidateQueries({ queryKey: ['calibracoes'] })
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      enqueueSnackbar(`${checagem ? 'Checagem' : 'Calibração'} criada com sucesso!`, {
        variant: 'success'
      });
      formCreate.reset();
      setOpenForm(false);
    },
    onError: (error) => {
      setError(error?.response?.data);
      enqueueSnackbar(`Erro ao criar ${checagem ? 'Checagem' : 'Calibração'}. Tente novamente!`, {
        variant: 'error'
      });
    },
  })


  const edit = async (params) => {
    const data = formatedData(params?.form)
    const response = await axios.patch(`/calibracoes/${params?.id}/`, { ...data, instrumento });
    return response.data;
  }

  const {
    mutate: mutateEdit,
    isLoading: isLoadingEdit,
  } = useMutation({
    mutationFn: edit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibracoes'] });
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] });
      setOpenEdit(false);
      setSelectedCalibration({});
      enqueueSnackbar(`${checagem ? 'Checagem' : 'Calibração'} editada com sucesso!`, {
        variant: 'success'
      });
    },
    onError: (error) => {
      setError(error?.response?.data);
      enqueueSnackbar(`Erro ao editar ${checagem ? 'Checagem' : 'Calibração'}. Tente novamente!`, {
        variant: 'error'
      });
    },
  })


  const addCertificate = async (params) => {
    const { data } = await axiosForFiles.post(`/calibracoes/${params?.id}/adicionar_certificado/`, { arquivo: params?.arquivo, numero: params?.numero })
    const anexosPromises = params?.anexos?.map(async anexo => {
      const formData = new FormData()
      formData.append('anexo', anexo?.anexo)
      formData.append('certificado', data?.id)
      const {data: dataAnexo } = await axiosForFiles.patch(`/calibracoes/anexar/`, formData)
      return dataAnexo
    })
    const anexos = await Promise.all(anexosPromises)
    data.anexos = anexos
    return data;
  }

  const {
    mutate: mutateAddCertificate,
    isLoading: isLoadingAddCertificate,
    data: dataAddCertificate,
  } = useMutation({
    mutationFn: addCertificate,
    onSuccess: async (res) => {
      setSelectedCalibration(selCalibration => {
        if (!selCalibration) return selCalibration;
      
        return {
          ...selCalibration,
          certificados: [...(selCalibration.certificados || []), res],
        };
      });
      setOpenCreateCertificate(false)
      enqueueSnackbar('Certificado adicionado com sucesso!', {
        variant: 'success'
      });
    }, 
    onError: (error) => {
      setError(error?.response?.data);
      enqueueSnackbar('Erro ao adicionar certificado. Tente novamente!', {
        variant: 'error'
      });
    },
  })

  const {
    mutateAsync: mutateAddCertificateAsync,
  } = useMutation({
    mutationFn: addCertificate,
    onSuccess: async (res) => {
      setSelectedCalibration(selCalibration => {
        if (!selCalibration) return selCalibration;
      
        return {
          ...selCalibration,
          certificados: [...(selCalibration.certificados || []), res],
        };
      });
      setOpenCreateCertificate(false)
      enqueueSnackbar('Certificado adicionado com sucesso!', {
        variant: 'success'
      });
    }, 
    onError: (error) => {
      setError(error?.response?.data);
      enqueueSnackbar('Erro ao adicionar certificado. Tente novamente!', {
        variant: 'error'
      });
    },
  })

  const deleteCertificate = async (params) => {
    await axios.post(`/calibracoes/${params?.id}/apagar_certificado/`, { id: params?.idCertificado })
  }
   
  const {
    mutate: mutateDeleteCertificate,
    isLoading: isLoadingDeleteCertificate,
  } = useMutation({
    mutationFn: deleteCertificate,
    onSuccess: async (_, data) => {
      setSelectedCalibration(selCalibration => ({...selCalibration, certificados: selCalibration?.certificados?.filter(certificado => certificado?.id !== data?.idCertificado)}))
      enqueueSnackbar('Certificado deletado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (error) => {
      enqueueSnackbar('Erro ao deletar certificado. Tente novamente!', {
        variant: 'error'
      });
    },
  })

  const exportMovements = async() => {
    try {
      const resposta = await axios.get(
        `/instrumentos/${Number(instrumento)}/exportar_movimentacoes/`,
        { responseType: "blob" }
      );
  
  
      if (resposta.status === 200) {
        const url = window.URL.createObjectURL(new Blob([resposta.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `relatorio_movimentacoes_${instrumento}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        enqueueSnackbar('Exportação realizada com sucesso!', {
          variant: 'success'
        });
      } else {
        enqueueSnackbar('Erro ao exportar movimentações. Tente novamente!', {
          variant: 'error'
        });
      }
    } catch (error) {
      enqueueSnackbar('Erro ao exportar movimentações. Tente novamente!', {
        variant: 'error'
      });
    }
  }



  return {
    error,
    search,
    setSearch,
    errorCreating,
    mutateDeleteCalibration,
    mutateCreation,
    mutateEdit,
    mutateAddCertificate,
    mutateDeleteCertificate,
    isDeletingCalibration,
    isLoadingCreation,
    isLoadingEdit,
    isLoadingAddCertificate,
    isLoadingDeleteCertificate,
    dataAddCertificate,
    selectedCalibration,
    setSelectedCalibration,
    form,
    handleCloseForm,
    handleOpenForm,
    openForm,
    openEdit,
    setOpenEdit,
    openCreateCertificate,
    setOpenCreateCertificate,
    formCreate,
    error,
    setError,
    exportMovements,
    debouncedSearch,
    checagem
  }
}

export default useCalibrationsMutations;