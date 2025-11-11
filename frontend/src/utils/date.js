import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

export const dateDistanceText = (targetDate) => {
  const date = dayjs(targetDate)
  return dayjs().to(date) // exemplo: "em 2 meses" ou "há 3 dias"
}


export const findDateStatusColor = (targetDate) => {
  const daysDiff = dayjs(targetDate).diff(dayjs(), 'day')

  if (daysDiff > 30) return 'success'     
  if (daysDiff >= 0) return 'warning' 
  return 'error' 
}