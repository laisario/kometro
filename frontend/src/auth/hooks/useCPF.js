import { useMemo } from "react"

export const regexCPF = /^\d{3}.\d{3}.\d{3}-\d{2}$/

export function validarCPF(value = '') {
  if (!value) return false

  const isString = typeof value === 'string'
  const validTypes = isString || Number.isInteger(value) || Array.isArray(value)

  if (!validTypes) return false

  if (isString) {
      const digitsOnly = /^\d{11}$/.test(value)
      const validFormat = regexCPF.test(value)
      const isValid = digitsOnly || validFormat

      if (!isValid) return false
  }

  const numbers = matchNumbers(value)

  if (numbers.length !== 11) return false

  const items = [...new Set(numbers)]
  if (items.length === 1) return false

  const base = numbers.slice(0, 9)
  const digits = numbers.slice(9)

  const calc0 = base
      .map((n, i) => baseCalc(n, i, numbers.length - 1))
      .reduce((a, b) => a + b, 0)

  const digit0 = digitCalc(calc0, numbers)

  if (digit0 !== digits[0]) return false

  const calc1 = base
      .concat(digit0)
      .map((n, i) => baseCalc(n, i, numbers.length))
      .reduce((a, b) => a + b, 0)

  const digit1 = digitCalc(calc1, numbers)

  return digit1 === digits[1]
}

export function formatCPF(value = '') {
  const valid = validarCPF(value)

  if (!valid) return ''

  const numbers = matchNumbers(value)
  const text = numbers.join('')

  const format = text.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

  return format
}

function baseCalc(n, i, x) {
  return n * (x - i)
}

function digitCalc(n, numbers) {
  const rest = n % numbers.length
  return rest < 2 ? 0 : numbers.length - rest
}

function matchNumbers(value = '') {
  const match = value.toString().match(/\d/g)
  return Array.isArray(match) ? match.map(Number) : []
}

const useCPF = (cpf) => {
  const formattedCPF = useMemo(() => formatCPF(cpf), [cpf])
  const isValid = useMemo(() => validarCPF(cpf), [cpf])

  return {
    cpf: formattedCPF,
    isValid,
  }
}


export default useCPF
