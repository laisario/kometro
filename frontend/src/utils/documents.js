import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime'

export const criticalAnalysisMonths = (criticalAnalysis) => {
  dayjs.extend(relativeTime);
  dayjs.locale('pt-br')
  if (criticalAnalysis > 0) {
    const date = dayjs(new Date()).add(criticalAnalysis, 'days')
    return dayjs(new Date()).to(date)
  }
  const date = dayjs(new Date()).subtract(criticalAnalysis, 'days')
  return dayjs(new Date()).from(date)
}

export const findCriticalAnalysisStage = (criticalAnalysis) => {
  let color = ''
  if (criticalAnalysis > 30) {
    color = 'success'
  } else if (criticalAnalysis < 1) {
    color = 'error'
  } else {
    color = 'warning'
  }
  return color
}

export const status = {
  'V': 'Vigente',
  'O': 'Obsoleto',
  'C': 'Cancelado'
}

export const statusColor = {
  'O': 'warning',
  'C': 'error',
  'V': 'success',
};

export const headCells = [
  {
    id: 'codigo',
    label: 'Código',
  },
  {
    id: 'titulo',
    label: 'Título',
  },
  {
    id: 'status',
    label: 'Status',
  },
  {
    id: 'elaborador',
    label: 'Elaborador',
  },
  {
    id: 'validade',
    label: 'Data Validade',
  },
  {
    id: 'analiseCritica',
    label: 'Análise Critica',
  },
];

export const availableFormats = 'Formatos dísponiveis: PDF, XLSX, XLSM, DOCX, DOC, PPTX, PPT'