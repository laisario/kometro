import useAuth from '../../auth/hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import useDashboardMutations from '../hooks/useDashboardMutations'
import useMyOrdensServico from '../../equipe/hooks/useMyOrdensServico'

export const useDashboardVM = () => {
  const { user } = useAuth()
  const { data } = useDashboard()
  const isAdmin = !!user?.admin

  const { mutateUpdateStats, isLoadingUpdateStats } = useDashboardMutations()

  const {
    ordensServico: recentOS,
    isLoadingOrdensServico: isLoadingRecentOS,
  } = useMyOrdensServico({
    limit: 5,
    enabled: isAdmin,
  })

  const shouldShowOSWidget = isAdmin
  
  const instruments = data?.instrumentosRecentes?.map((instrumento) => ({
    id: instrumento?.id,
    isExpired: instrumento?.expirado,
    descricao: instrumento?.instrumento?.tipoDeInstrumento?.descricao,
    tag: instrumento?.tag,
    fabricante: instrumento?.instrumento.tipoDeInstrumento?.fabricante,
    modelo: instrumento?.instrumento?.tipoDeInstrumento?.modelo,
    faixaNominalMin: instrumento?.instrumento?.minimo,
    faixaNominalMax: instrumento?.instrumento?.maximo,
    unidade: instrumento?.instrumento?.unidade,
    data: instrumento.expirado
      ? instrumento?.dataUltimaCalibracao
      : instrumento?.dataProximaCalibracao,
    setor: instrumento?.setor
  }))

  const documents = data?.revisoesASeremAprovadas

  return {
    user,
    data,
    instruments,
    documents,
    recentOS,
    isLoadingRecentOS,
    shouldShowOSWidget,
    mutateUpdateStats, 
    isLoadingUpdateStats
  }
}
