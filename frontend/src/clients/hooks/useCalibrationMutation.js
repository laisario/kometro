import { useEffect, useMemo, useState } from 'react';
import _, {debounce} from 'lodash';
import { useMutation, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import { axios, axiosForFiles } from '../../api';
import { enqueueSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';


const FILE_STORAGE_ERROR_MESSAGE = 'Erro de armazenamento de arquivos. Tente novamente mais tarde.';

export const getCalibrationUploadErrorMessage = (error, fallbackMessage) => (
  error?.response?.data?.error === 'file_storage_error'
    ? FILE_STORAGE_ERROR_MESSAGE
    : fallbackMessage
);


const useCalibrationsMutations = (id, instrumento, checagem) => {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCalibration, setSelectedCalibration] = useState({});
  const [openForm, setOpenForm] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCreateCertificate, setOpenCreateCertificate] = useState(false);
  const [error, setError] = useState({});
  const queryClient = useQueryClient();

  const upsertCalibrationInList = (current, calibration) => {
    if (!Array.isArray(current) || !calibration?.id) return current;

    const exists = current.some((item) => String(item?.id) === String(calibration.id));
    if (exists) {
      return current.map((item) => (
        String(item?.id) === String(calibration.id) ? { ...item, ...calibration } : item
      ));
    }

    return [calibration, ...current];
  };

  const updateCreatedCalibrationCache = (calibration) => {
    if (!calibration?.id || !instrumento) return;

    const instrumentIds = Array.from(
      new Set([instrumento, String(instrumento), Number(instrumento)].filter((value) => !Number.isNaN(value)))
    );
    instrumentIds.forEach((instrumentId) => {
      queryClient.setQueryData(
        ['calibracoes', '', instrumentId, null, checagem],
        (current) => upsertCalibrationInList(current, calibration)
      );
    });
  };

  useEffect(() => { setSelectedCalibration({}) }, [instrumento])

  
  const handleSearchOS = useMemo(
    () => debounce((value) => setDebouncedSearch(value), 500),
    []
  );

  useEffect(() => {
    handleSearchOS(search);
    return () => handleSearchOS.cancel();
  }, [search, handleSearchOS]);
  
  const firstCertificado = selectedCalibration?.certificados?.[0];
  const buildResultadosDefaults = (calibration) => (
    calibration?.resultados?.length
      ? calibration.resultados.map((resultado) => ({
        id: resultado?.id,
        criterio: resultado?.criterio?.id ? String(resultado.criterio.id) : '',
        maiorErro: resultado?.maiorErro ?? '',
        incerteza: resultado?.incerteza ?? '',
      }))
      : [{ criterio: '', maiorErro: '', incerteza: '' }]
  );
  const defaultValues = useMemo(() => ({
    local: selectedCalibration?.local ? selectedCalibration?.local : 'P',
    data: selectedCalibration?.data ? selectedCalibration?.data : null,
    ordemDeServico: selectedCalibration?.ordemDeServico ? selectedCalibration?.ordemDeServico : '',
    observacoes: selectedCalibration?.observacoes ? selectedCalibration?.observacoes : '',
    resultados: buildResultadosDefaults(selectedCalibration),
    preco: selectedCalibration?.preco ? selectedCalibration.preco : null,
    laboratorio: selectedCalibration?.laboratorio ? selectedCalibration.laboratorio : '',
    observacaoFornecedor: selectedCalibration?.observacaoFornecedor ? selectedCalibration.observacaoFornecedor : '',
    numero: firstCertificado?.numero ?? '',
    certificadoId: firstCertificado?.id ?? null,
    arquivo: firstCertificado?.arquivo ?? null,
    anexos: [],
  }), [selectedCalibration])
  
  const form = useForm({ defaultValues })
  const formCreate = useForm({ defaultValues: {
    local: 'P',
    data: null,
    ordemDeServico: '',
    observacoes: '',
    resultados: [{ criterio: '', maiorErro: '', incerteza: '' }],
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
      queryClient.invalidateQueries(['calibracoes'])
      queryClient.invalidateQueries(['instrumentos'])
      queryClient.invalidateQueries(['dashboard'])
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


  const normalizeDecimal = (value) => {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim().replace(',', '.');
  };

  const formatedData = (form) => {
    const { certificadoId, ...rest } = form || {};
    const resultados = (form?.resultados || [])
      .map((resultado) => ({
        id: resultado?.id || null,
        criterio: resultado?.criterio || null,
        maiorErro: normalizeDecimal(resultado?.maiorErro),
        incerteza: normalizeDecimal(resultado?.incerteza),
      }))
      .filter((resultado) => (
        resultado.criterio || resultado.maiorErro !== null || resultado.incerteza !== null
      ));

    return {
      ...rest,
      data: form?.data && dayjs(form?.data)?.format('YYYY-MM-DD'),
      resultados,
    };
  };

  const create = async (params) => {
    const data = formatedData(params?.form)
    const response = await axios.post(`/calibracoes/`, { ...data, instrumento, checagem,});
    return response.data;
  }

  const fetchCalibrationById = async (calibrationId) => {
    if (!calibrationId) return null;

    const response = await axios.get(`/calibracoes/${calibrationId}/`, {
      params: { page_size: 9999, checagem },
    });
    return response?.data;
  };

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

      let calibrationToCache = createdCalibration;
      try {
        calibrationToCache = await fetchCalibrationById(createdCalibration?.id) || createdCalibration;
      } catch (e) {
        console.error('Erro ao atualizar cache da calibração criada:', e);
      }
  
      updateCreatedCalibrationCache(calibrationToCache);
      queryClient.invalidateQueries(['calibracoes'])
      queryClient.invalidateQueries(['instrumentos'])
      queryClient.invalidateQueries(['dashboard'])
      enqueueSnackbar(`${checagem ? 'Checagem' : 'Calibração'} criada com sucesso!`, {
        variant: 'success'
      });
      formCreate.reset({
        local: 'P',
        data: null,
        ordemDeServico: '',
        observacoes: '',
        resultados: [{ criterio: '', maiorErro: '', incerteza: '' }],
        arquivo: null,
        numero: '',
        anexos: [],
        preco: null,
        laboratorio: '',
        observacaoFornecedor: '',
      });
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
    const formData = params?.form;
    const data = formatedData(formData);
    const response = await axios.patch(`/calibracoes/${params?.id}/`, { ...data, instrumento });
    return { ...response.data, _formData: formData };
  }

  const updateCertificate = async (calibracaoId, certificadoId, numero, arquivo) => {
    const hasFile = arquivo && arquivo instanceof File;
    if (hasFile) {
      const formData = new FormData();
      formData.append('certificado_id', certificadoId);
      if (numero != null) formData.append('numero', numero ?? '');
      formData.append('arquivo', arquivo);
      await axiosForFiles.post(`/calibracoes/${calibracaoId}/atualizar_certificado/`, formData);
    } else {
      await axios.post(`/calibracoes/${calibracaoId}/atualizar_certificado/`, {
        certificado_id: certificadoId,
        numero: numero ?? '',
      });
    }
  };

  const {
    mutate: mutateEdit,
    isLoading: isLoadingEdit,
  } = useMutation({
    mutationFn: edit,
    onSuccess: async (result, variables) => {
      const formData = result?._formData;
      const calibracaoId = variables?.id;
      const certificadoId = formData?.certificadoId;
      const newNumero = formData?.numero;
      const arquivo = formData?.arquivo;

      const shouldUpdateCertificate = certificadoId && calibracaoId && (
        (arquivo && arquivo instanceof File) ||
        (String(newNumero ?? '').trim() !== String(selectedCalibration?.certificados?.[0]?.numero ?? '').trim())
      );

      if (shouldUpdateCertificate) {
        try {
          await updateCertificate(calibracaoId, certificadoId, newNumero ?? '', arquivo);
        } catch (e) {
          console.error('Erro ao atualizar certificado:', e);
          const message = getCalibrationUploadErrorMessage(
            e,
            'Calibração atualizada, mas atualização do certificado falhou.'
          );
          enqueueSnackbar(message, {
            variant: e?.response?.data?.error === 'file_storage_error' ? 'error' : 'warning'
          });
        }
      }

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
      enqueueSnackbar(getCalibrationUploadErrorMessage(
        error,
        'Erro ao adicionar certificado. Tente novamente!'
      ), {
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
      enqueueSnackbar(getCalibrationUploadErrorMessage(
        error,
        'Erro ao adicionar certificado. Tente novamente!'
      ), {
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
