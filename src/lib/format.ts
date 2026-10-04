// Utilitários portados do protótipo da Central de QA (Claude Design).
import type { CorpoFix, Modulo } from '@/types'

export const PALS: [string, string][] = [
  ['#8FF0F2', '#C39BF5'],
  ['#7BE0B8', '#6FA8FF'],
  ['#FF9EC7', '#A98BF5'],
  ['#FFC879', '#FF8FA3'],
  ['#9FB7FF', '#7EF0F0'],
  ['#D7A6FF', '#FF9EC7'],
  ['#A6F0B4', '#6FD3E8'],
  ['#FFB38A', '#C39BF5'],
]

export const EMOJIS = ['', '🔐', '🏠', '📝', '🧮', '📊', '📈', '🌎', '🚚', '🎬', '🎙️', '📰', '📦', '⚙️', '💰', '🧾', '📇', '🗂️', '🖼️', '🔔', '🧪', '🛡️', '🌱', '⏱️', '🔁']

export const INTRO =
  'Ajustes identificados na validação. Cada item traz onde acontece, como reproduzir, o que ocorre hoje e o que se espera após a correção. Marque cada fix ao concluir.'

export const pad = (n: number) => String(n).padStart(2, '0')
export const lines = (t: string) =>
  String(t || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export const hashStr = (s: string) => {
  let x = 0
  for (const c of s) x = (x * 31 + c.codePointAt(0)!) >>> 0
  return x
}

export const palIndex = (m: Pick<Modulo, 'nome' | 'cor'>) => (m.cor ?? hashStr(m.nome || '')) % PALS.length
export const palOf = (m: Pick<Modulo, 'nome' | 'cor'>) => PALS[palIndex(m)]

export const coverBg = (p: [string, string]) =>
  `radial-gradient(circle at 18% 12%, ${p[0]} 0, transparent 58%), radial-gradient(circle at 88% 100%, ${p[1]} 0, transparent 62%), #151936`
export const swatchBg = (p: [string, string]) =>
  `radial-gradient(circle at 20% 15%, ${p[0]} 0, transparent 70%), radial-gradient(circle at 90% 100%, ${p[1]} 0, transparent 75%), #151936`
export const heroBg = (p: [string, string]) =>
  `radial-gradient(circle at 12% 0%, ${p[0]}80 0, transparent 55%), radial-gradient(circle at 95% 120%, ${p[1]}80 0, transparent 60%), #111430`

export const initials = (n: string) => {
  const w = String(n || '')
    .split(/\s+/)
    .filter((x) => x.length > 2)
  return (w.length ? w : [n || '?'])
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase()
}

export const fmtData = (ms: number) =>
  new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

/** Linhas de "Ajuste esperado": as que começam com ">" são o texto exato que deve aparecer na tela. */
export const esperadoItens = (esperado: string[]) =>
  esperado.map((t) => ({ quote: t.startsWith('>'), t: t.replace(/^>\s*/, '') }))

export const fixVazio = (f: Pick<CorpoFix, 'onde' | 'atual' | 'passos' | 'esperado'>) =>
  !f.onde && !f.atual && !f.passos.length && !f.esperado.length

export const fixCode = (key: string) => key.replace('fix-', 'FIX ')
