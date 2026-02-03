import useAuth from '../../auth/hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import useDashboardMutations from '../hooks/useDashboardMutations'
import useMyOrdensServico from '../../equipe/hooks/useMyOrdensServico'

export const useDashboardVM = () => {
  const { user } = useAuth()
  const { data } = useDashboard()
  // Enable for authenticated users - API will return 403 if not staff
  const isAuthenticated = !!user

  const { mutateUpdateStats, isLoadingUpdateStats } = useDashboardMutations()
  
  // Fetch recent OS for staff users (last 5)
  // API will return 403 if user is not staff, hook will handle gracefully
  const { 
    ordensServico: recentOS, 
    isLoadingOrdensServico: isLoadingRecentOS,
    errorOrdensServico: errorRecentOS
  } = useMyOrdensServico({ 
    limit: 5, 
    enabled: isAuthenticated 
  })
  
  // Only show widget if user is staff
  // 403 means user is not staff, hide widget in that case
  // Show widget if: authenticated AND (has data OR loading) AND not a 403 error
  const shouldShowOSWidget = isAuthenticated && 
    (recentOS !== undefined || isLoadingRecentOS) && 
    errorRecentOS?.response?.status !== 403
  
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
