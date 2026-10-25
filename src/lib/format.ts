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
/** Capa com imagem enviada (data URL) ou com a paleta. */
export const capaBg = (capa: string | undefined, p: [string, string]) =>
  capa ? `center/cover no-repeat url("${capa}")` : coverBg(p)

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

/** Iniciais do avatar de uma pessoa (no máximo 2 letras). */
export const iniPessoa = (n: string) => initials(n).slice(0, 2) || String(n || '?')[0].toUpperCase()

/** Sigla sugerida para um sistema a partir do nome. */
export const autoIni = (n: string) => {
  const w = String(n || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!w.length) return ''
  if (w.length === 1) return w[0].replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()
  return w
    .slice(0, 3)
    .map((x) => x[0])
    .join('')
    .toUpperCase()
}

export const fmtData = (ms: number) =>
  new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDH = (ms: number) =>
  new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
export const hojeEyebrow = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()

/** Texto sem acentos e em minúsculas, para buscas. */
export const nq = (x: unknown) =>
  String(x ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export const slug = (s: string) =>
  nq(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const tagList = (t: string) =>
  String(t || '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((x) => (x.startsWith('@') ? x : '@' + x))

export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Linhas de "Ajuste esperado": as que começam com ">" são o texto exato que deve aparecer na tela. */
export const esperadoItens = (esperado: string[]) =>
  esperado.map((t) => ({ quote: t.startsWith('>'), t: t.replace(/^>\s*/, '') }))

export const fixVazio = (f: Pick<CorpoFix, 'onde' | 'atual' | 'passos' | 'esperado'>) =>
  !f.onde && !f.atual && !f.passos.length && !f.esperado.length

export const fixCode = (key: string) => key.replace('fix-', 'FIX ')

/** Nome do módulo de uma ocorrência (vazio vira "Geral"). */
export const modOf = (f: { modulo: string }) => (f.modulo || '').trim() || 'Geral'

/** Lista "a, b e c". */
export const listaE = (xs: string[]) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1] : xs[0] || '')

export const saudacao = (nome: string) => {
  const hr = new Date().getHours()
  const first = String(nome || '').split(' ')[0]
  return (hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite') + (first ? ', ' + first : '')
}
