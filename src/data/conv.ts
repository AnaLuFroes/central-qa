import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import type { CorpoFix, Print } from '@/types'

export const ms = (v: unknown): number =>
  v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now()

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
const prints = (v: unknown): Print[] =>
  Array.isArray(v) ? v.filter((p) => typeof p?.id === 'string').map((p) => ({ id: p.id, nome: p.nome ?? '' })) : []

export const corpo = (d: DocumentData): CorpoFix => ({
  titulo: str(d.titulo),
  tipo: d.tipo === 'erro' ? 'erro' : 'melhoria',
  prioridade: d.prioridade === 'alta' || d.prioridade === 'baixa' ? d.prioridade : 'normal',
  onde: str(d.onde),
  passos: strs(d.passos),
  atual: str(d.atual),
  erro: str(d.erro),
  esperado: strs(d.esperado),
  obs: str(d.obs),
  prints: prints(d.prints),
})

export type Snap = QueryDocumentSnapshot<DocumentData>
