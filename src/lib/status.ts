// Ciclo de vida da ocorrência e das respostas do dev (portado do protótipo).
import type { CaSt, Camada, Lote, Ocorrencia, Repro, ResSt, Resposta, RespSt, Respostas } from '@/types'

/** [rótulo, cor do texto, cor do fundo] — cores como variáveis CSS do tema. */
export type Cor3 = readonly [string, string, string]

const C = {
  warn: ['var(--cqa-warn)', 'var(--cqa-warn-bg)'],
  accent: ['var(--cqa-accent)', 'var(--cqa-soft)'],
  info: ['var(--cqa-info)', 'var(--cqa-info-bg)'],
  red: ['var(--cqa-red)', 'var(--cqa-red-bg)'],
  muted: ['var(--cqa-muted)', 'var(--cqa-track)'],
  ok: ['var(--cqa-ok)', 'var(--cqa-ok-bg)'],
} as const

const c3 = (label: string, c: readonly [string, string]): Cor3 => [label, c[0], c[1]]

export type StatusVisivel = 'aberto' | 'enviado' | 'retorno' | 'reteste' | 'reaberto' | 'adiada' | 'encerrado' | 'validado'

export const STATUS: Record<StatusVisivel, Cor3> = {
  aberto: c3('Não enviada', C.warn),
  enviado: c3('Com o dev', C.accent),
  retorno: c3('Dev respondeu', C.warn),
  reteste: c3('Aguardando reteste', C.info),
  reaberto: c3('Reaberta', C.red),
  adiada: c3('Adiada pelo dev', C.muted),
  encerrado: c3('Encerrada sem correção', C.muted),
  validado: c3('Validada', C.ok),
}

export const RESP: Record<RespSt, Cor3> = {
  corrigido: c3('Corrigido', C.ok),
  naorep: c3('Não consegui reproduzir', C.warn),
  info: c3('Preciso de mais informação', C.warn),
  esperado: c3('É o comportamento esperado', C.info),
  adiado: c3('Adiado', C.muted),
}
export const RESP_KEYS = Object.keys(RESP) as RespSt[]

export const RESP_PH: Record<RespSt, string> = {
  corrigido: 'O que foi alterado (opcional).',
  naorep: 'O que você tentou e o que aconteceu.',
  info: 'O que você precisa saber para corrigir.',
  esperado: 'Qual regra ou decisão sustenta o comportamento atual.',
  adiado: 'Motivo e previsão, se houver.',
}

export const REPRO: Record<Repro, string> = { sempre: 'Sempre', asvezes: 'Às vezes', umavez: 'Aconteceu uma vez' }

export const CA_ST: Record<CaSt, Cor3> = {
  rascunho: c3('Rascunho', C.warn),
  revisao: c3('Em revisão com o PO', C.info),
  aprovado: c3('Aprovado', C.ok),
}

export const CAMADAS: [Camada, string][] = [
  ['api', 'API'],
  ['e2e', 'E2E (tela)'],
  ['manual', 'Manual'],
]

export const RES: Record<ResSt, readonly [string, string]> = {
  passou: ['Passou', 'var(--cqa-ok)'],
  falhou: ['Falhou', 'var(--cqa-red)'],
  bloqueado: ['Bloqueado', 'var(--cqa-warn)'],
}

export const respId = (loteId: string, key: string) => `${loteId}__${key}`

/** Chave do item (fix-NN) da ocorrência dentro do lote. */
export function itemKey(lote: Lote | undefined, ocorrenciaId: string): string | null {
  if (!lote) return null
  for (const sc of lote.secoes) for (const it of sc.itens) if (it.ocorrenciaId === ocorrenciaId) return it.key
  return null
}

export function respOf(resp: Respostas, loteId: string, key: string | null): Resposta | null {
  return key ? resp[loteId]?.[key] ?? null : null
}

/** Resposta do dev para a ocorrência no lote em que ela está agora. */
export function respFix(f: Pick<Ocorrencia, 'id' | 'loteId'>, lotes: Lote[], resp: Respostas): Resposta | null {
  if (!f.loteId) return null
  const l = lotes.find((x) => x.id === f.loteId)
  return respOf(resp, f.loteId, itemKey(l, f.id))
}

/** Status exibido da ocorrência, derivado do status gravado, do lote e da resposta do dev. */
export function stOf(f: Pick<Ocorrencia, 'status' | 'loteId'>, r: Resposta | null): StatusVisivel {
  if (f.status === 'validado') return 'validado'
  if (f.status === 'encerrado') return 'encerrado'
  if (f.loteId) {
    if (!r || !r.st) return 'enviado'
    if (r.st === 'corrigido') return 'reteste'
    if (r.st === 'adiado') return 'adiada'
    return 'retorno'
  }
  return f.status === 'reaberto' ? 'reaberto' : 'aberto'
}

/** Ações do QA disponíveis em cada status. */
export function acoesFix(st: StatusVisivel, r: Resposta | null, temRegressao: boolean) {
  const canReply = st === 'retorno' || st === 'adiada'
  return {
    canReply,
    canClose: canReply && !!r && (r.st === 'esperado' || r.st === 'adiado'),
    canVal: st === 'reteste',
    canReab: st === 'reteste' || st === 'validado',
    canReg: st === 'validado' && !temRegressao,
  }
}

export interface LoteStats {
  total: number
  dn: number
  pend: number
  pct: number
}

export function loteStats(l: Lote, resp: Respostas): LoteStats {
  const dm = resp[l.id] ?? {}
  let total = 0
  let dn = 0
  for (const sc of l.secoes)
    for (const it of sc.itens) {
      total++
      if (dm[it.key]?.st) dn++
    }
  return { total, dn, pend: total - dn, pct: total ? Math.round((dn / total) * 100) : 0 }
}

/** Rótulo do item do lote (visão do dev e do QA na página do lote). */
export function rotuloItem(r: Resposta | null, reaberta: boolean, validada: boolean): Cor3 {
  if (reaberta) return c3('Reaberta pelo QA', C.red)
  if (validada) return c3('Validada pelo QA', C.ok)
  if (r?.st) return RESP[r.st]
  if (r && r.thread.length) return c3('Nova resposta do QA', C.accent)
  return c3('Aguardando resposta', C.warn)
}
