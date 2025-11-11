import useAuth from '../../auth/hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import useDashboardMutations from '../hooks/useDashboardMutations'

export const useDashboardVM = () => {
  const { user } = useAuth()
  const { data } = useDashboard()

  const { mutateUpdateStats, isLoadingUpdateStats } = useDashboardMutations()
  
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
    mutateUpdateStats, 
    isLoadingUpdateStats
  }
}
