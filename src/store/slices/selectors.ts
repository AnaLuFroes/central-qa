import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { modOf } from '@/lib/format'
import { comStatus } from '@/lib/painel'
import { loteStats, type LoteStats } from '@/lib/status'
import type { Modulo } from '@/types'

export const selSisId = (s: RootState) => s.ui.sis
export const selSistemas = (s: RootState) => s.data.sistemas
export const selRespostas = (s: RootState) => s.data.respostas
const selModulosAll = (s: RootState) => s.data.modulos
const selOcorrenciasAll = (s: RootState) => s.data.ocorrencias
const selLotesAll = (s: RootState) => s.data.lotes
const selFeaturesAll = (s: RootState) => s.data.features
const selRodadasAll = (s: RootState) => s.data.rodadas

export const selSistemasOrdenados = createSelector([selSistemas], (xs) =>
  [...xs].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
)
export const selSistema = createSelector([selSistemas, selSisId], (xs, id) => xs.find((x) => x.id === id) ?? null)

const doSis = <T extends { sis: string }>(xs: T[], sis: string | null) => (sis ? xs.filter((x) => x.sis === sis) : [])

export const selOcorrencias = createSelector([selOcorrenciasAll, selSisId], doSis)
export const selLotes = createSelector([selLotesAll, selSisId], (xs, sis) =>
  doSis(xs, sis).sort((a, b) => b.criadoEm - a.criadoEm),
)
export const selFeatures = createSelector([selFeaturesAll, selSisId], doSis)
export const selRodadas = createSelector([selRodadasAll, selSisId], (xs, sis) =>
  doSis(xs, sis).sort((a, b) => b.criadoEm - a.criadoEm),
)

/** Módulos cadastrados mais os nomes usados por ocorrências sem módulo cadastrado, em ordem alfabética. */
export const selModulos = createSelector([selModulosAll, selOcorrencias, selSisId], (ms, fs, sis): Modulo[] => {
  const map = new Map<string, Modulo>()
  for (const m of doSis(ms, sis)) map.set(m.nome, m)
  for (const f of fs) {
    const n = modOf(f)
    if (!map.has(n)) map.set(n, { id: '', sis: sis ?? '', nome: n, emoji: '', cor: null, criadoEm: 0 })
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
})

/** Ocorrências do sistema com o status visível. */
export const selComStatus = createSelector([selOcorrencias, selLotesAll, selRespostas], comStatus)

export const selLoteStats = createSelector([selLotesAll, selRespostas], (ls, r) => {
  const out: Record<string, LoteStats> = {}
  for (const l of ls) out[l.id] = loteStats(l, r)
  return out
})

export const selSelecionadas = createSelector([selOcorrencias, (s: RootState) => s.ui.selecao], (os, sel) =>
  os.filter((o) => sel[o.id]),
)

export const moduloPorNome = (ms: Modulo[], nome: string) =>
  ms.find((m) => m.nome.toLowerCase() === nome.trim().toLowerCase())
