// Números da visão geral e das rodadas (portado do protótipo).
import type { Feature, Lote, Ocorrencia, Respostas, Rodada } from '@/types'
import { STATUS, respFix, stOf, type StatusVisivel } from './status'
import { modOf, plural } from './format'

export interface ComStatus {
  f: Ocorrencia
  st: StatusVisivel
}

export const comStatus = (fixes: Ocorrencia[], lotes: Lote[], resp: Respostas): ComStatus[] =>
  fixes.map((f) => ({ f, st: stOf(f, respFix(f, lotes, resp)) }))

export const contar = (all: ComStatus[], k: StatusVisivel) => all.filter((x) => x.st === k).length

export const temRegressao = (f: Ocorrencia, feats: Feature[]) => !!f.regFeatId && feats.some((y) => y.id === f.regFeatId)

export type KindFila = 'resp' | 'ret' | 'reab' | 'reg'
export interface ItemFila {
  kind: KindFila
  f: Ocorrencia
}

/** Fila "Agora é com você": respostas do dev, reteste, reabertas e validadas sem regressão. */
export function fila(all: ComStatus[], feats: Feature[]): ItemFila[] {
  return [
    ...all.filter((x) => x.st === 'retorno' || x.st === 'adiada').map(({ f }) => ({ kind: 'resp' as const, f })),
    ...all.filter((x) => x.st === 'reteste').map(({ f }) => ({ kind: 'ret' as const, f })),
    ...all.filter((x) => x.st === 'reaberto').map(({ f }) => ({ kind: 'reab' as const, f })),
    ...all.filter((x) => x.st === 'validado' && !temRegressao(x.f, feats)).map(({ f }) => ({ kind: 'reg' as const, f })),
  ]
}

export const FILA_KIND: Record<KindFila, readonly [string, string, string]> = {
  resp: ['RESPOSTA DO DEV', 'var(--cqa-warn)', 'var(--cqa-warn-bg)'],
  ret: ['RETESTE', 'var(--cqa-info)', 'var(--cqa-info-bg)'],
  reab: ['REABERTA', 'var(--cqa-red)', 'var(--cqa-red-bg)'],
  reg: ['VIRAR REGRESSÃO', 'var(--cqa-ok)', 'var(--cqa-ok-bg)'],
}

export interface PorModulo {
  nome: string
  tot: number
  meta: string
  pct: number
}

/** Módulos com pendências (abertas, com o dev ou em reteste), do maior para o menor. */
export function porModulo(all: ComStatus[], mods: string[]): PorModulo[] {
  const r = mods
    .map((nome) => {
      const xs = all.filter((x) => modOf(x.f) === nome)
      const ab = xs.filter((x) => x.st === 'aberto' || x.st === 'reaberto').length
      const dv = xs.filter((x) => x.st === 'enviado' || x.st === 'retorno' || x.st === 'adiada').length
      const rt = xs.filter((x) => x.st === 'reteste').length
      return {
        nome,
        tot: ab + dv + rt,
        meta: [ab && plural(ab, 'aberta', 'abertas'), dv && dv + ' com o dev', rt && rt + ' em reteste'].filter(Boolean).join(' · '),
        pct: 0,
      }
    })
    .filter((x) => x.tot > 0)
    .sort((a, b) => b.tot - a.tot)
  const mx = Math.max(1, ...r.map((x) => x.tot))
  for (const x of r) x.pct = Math.round((x.tot / mx) * 100)
  return r
}

export interface SegBarra {
  pct: number
  cor: string
  titulo: string
}

/** Barra proporcional dos status de todas as ocorrências do sistema. */
export function flowBar(all: ComStatus[]): SegBarra[] {
  const tot = all.length || 1
  const c = (k: StatusVisivel) => contar(all, k)
  const xs: [StatusVisivel, number][] = [
    ['aberto', c('aberto')],
    ['reaberto', c('reaberto')],
    ['enviado', c('enviado')],
    ['retorno', c('retorno') + c('adiada')],
    ['reteste', c('reteste')],
    ['validado', c('validado')],
  ]
  return xs.filter((x) => x[1]).map(([k, n]) => ({ pct: (n / tot) * 100, cor: STATUS[k][1], titulo: STATUS[k][0] + ': ' + n }))
}

/** Segmentos de status de um módulo (aberto, com o dev, reteste, validado). */
export function modSegs(all: ComStatus[]): SegBarra[] {
  const n = all.length || 1
  const g = { ab: 0, dv: 0, rt: 0, ok: 0 }
  for (const { st } of all) {
    if (st === 'aberto' || st === 'reaberto') g.ab++
    else if (st === 'reteste') g.rt++
    else if (st === 'validado') g.ok++
    else g.dv++
  }
  const cores: [keyof typeof g, string, string][] = [
    ['ab', 'var(--cqa-warn)', 'Abertas'],
    ['dv', 'var(--cqa-accent)', 'Com o dev'],
    ['rt', 'var(--cqa-info)', 'Em reteste'],
    ['ok', 'var(--cqa-ok)', 'Validadas'],
  ]
  return cores.filter(([k]) => g[k]).map(([k, cor, t]) => ({ pct: (g[k] / n) * 100, cor, titulo: t + ': ' + g[k] }))
}

export interface RodStats {
  t: number
  p: number
  f: number
  b: number
  pend: number
  exec: number
  pct: number
  counts: string
}

export function rodStats(r: Rodada): RodStats {
  const t = r.itens.length
  let p = 0
  let f = 0
  let b = 0
  for (const it of r.itens) {
    const x = r.res[it.key]?.st
    if (x === 'passou') p++
    else if (x === 'falhou') f++
    else if (x === 'bloqueado') b++
  }
  const pend = t - p - f - b
  return {
    t,
    p,
    f,
    b,
    pend,
    exec: p + f + b,
    pct: t ? Math.round(((p + f + b) / t) * 100) : 0,
    counts: p + ' passou · ' + f + ' falhou · ' + b + ' bloqueado · ' + pend + (pend === 1 ? ' pendente' : ' pendentes'),
  }
}

/** Cores fixas do resultado na barra da rodada. */
export const COR_RES = { passou: '#0F7A55', falhou: '#B42336', bloqueado: '#E0A33A' } as const

/** Barra de três cores (passou, falhou, bloqueado) de uma rodada. */
export function segsRodada(st: RodStats): SegBarra[] {
  const w = (n: number) => (st.t ? (n / st.t) * 100 : 0)
  return [
    { pct: w(st.p), cor: COR_RES.passou, titulo: 'Passou: ' + st.p },
    { pct: w(st.f), cor: COR_RES.falhou, titulo: 'Falhou: ' + st.f },
    { pct: w(st.b), cor: COR_RES.bloqueado, titulo: 'Bloqueado: ' + st.b },
  ]
}
