import { useEffect, useRef, useState } from 'react'

/**
 * Confirmação em dois cliques, como no protótipo: o primeiro arma (por 3,5 s),
 * o segundo executa. `armado(chave)` diz se aquele botão está esperando confirmação.
 */
export function useArmar() {
  const [armed, setArmed] = useState<string | null>(null)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  return {
    armado: (k: string) => armed === k,
    armar: (k: string, fn: () => void) => {
      clearTimeout(t.current)
      if (armed === k) {
        setArmed(null)
        fn()
        return
      }
      setArmed(k)
      t.current = setTimeout(() => setArmed(null), 3500)
    },
  }
}
