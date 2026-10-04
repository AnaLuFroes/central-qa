import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { Lote, Modulo, Ocorrencia } from '@/types'

export const selModulos = (s: RootState) => s.data.modulos
export const selOcorrencias = (s: RootState) => s.data.ocorrencias
export const selLotes = (s: RootState) => s.data.lotes
export const selProgresso = (s: RootState) => s.data.progresso

export interface StatsModulo {
  total: number
  erros: number
  melh: number
  pend: number
}

const stats = (fs: Ocorrencia[]): StatsModulo => ({
  total: fs.length,
  erros: fs.filter((f) => f.tipo === 'erro').length,
  melh: fs.filter((f) => f.tipo !== 'erro').length,
  pend: fs.filter((f) => !f.loteId).length,
})

export const selModulosOrdenados = createSelector([selModulos], (ms) =>
  [...ms].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
)

export const selOcorrenciasPorModulo = createSelector([selOcorrencias], (os) => {
  const m = new Map<string, Ocorrencia[]>()
  for (const o of os) {
    if (!m.has(o.moduloId)) m.set(o.moduloId, [])
    m.get(o.moduloId)!.push(o)
  }
  return m
})

export const selStatsGerais = createSelector([selOcorrencias], stats)

export const selStatsPorModulo = createSelector([selModulos, selOcorrenciasPorModulo], (ms, por) => {
  const r: Record<string, StatsModulo> = {}
  for (const m of ms) r[m.id] = stats(por.get(m.id) ?? [])
  return r
})

export interface LoteStats {
  total: number
  feitos: number
  pct: number
}

export const loteStats = (l: Lote, feitos: Record<string, boolean> | undefined): LoteStats => {
  const keys = l.secoes.flatMap((s) => s.itens.map((i) => i.key))
  const dn = keys.filter((k) => feitos?.[k]).length
  return { total: keys.length, feitos: dn, pct: keys.length ? Math.round((dn / keys.length) * 100) : 0 }
}

export const selLoteStats = createSelector([selLotes, selProgresso], (ls, p) => {
  const r: Record<string, LoteStats> = {}
  for (const l of ls) r[l.id] = loteStats(l, p[l.id])
  return r
})

export const selSelecionadas = createSelector(
  [selOcorrencias, (s: RootState) => s.ui.selecao],
  (os, sel) => os.filter((o) => sel[o.id]),
)

export const moduloPorNome = (ms: Modulo[], nome: string) =>
  ms.find((m) => m.nome.toLowerCase() === nome.trim().toLowerCase())
