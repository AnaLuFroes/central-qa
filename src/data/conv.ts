import { Timestamp, collection, doc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import type { CenarioRef, ContextoFix, CorpoFix, Print, Repro } from '@/types'

export const ms = (v: unknown): number =>
  v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now()
export const msOuNull = (v: unknown): number | null => (v == null ? null : ms(v))

export const str = (v: unknown) => (typeof v === 'string' ? v : '')
export const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
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

const repro = (v: unknown): Repro | '' => (v === 'sempre' || v === 'asvezes' || v === 'umavez' ? v : '')
const cenario = (v: unknown): CenarioRef | null => {
  const c = v as Partial<CenarioRef> | null
  return c && typeof c.featId === 'string'
    ? { featId: c.featId, feat: str(c.feat), titulo: str(c.titulo), ca: str(c.ca) }
    : null
}

export const contexto = (d: DocumentData): ContextoFix => ({
  cod: str(d.cod),
  modulo: str(d.modulo),
  amb: str(d.amb),
  repro: repro(d.repro),
  massa: str(d.massa),
  cenario: cenario(d.cenario),
  assunto: str(d.assunto),
})

export type Snap = QueryDocumentSnapshot<DocumentData>

/** Coleção dentro da empresa: orgs/{orgId}/{nome} */
export const orgCol = (orgId: string, nome: string) => collection(db, 'orgs', orgId, nome)
export const orgDoc = (orgId: string, nome: string, id: string) => doc(db, 'orgs', orgId, nome, id)

/** Remove chaves undefined (o Firestore não aceita). */
export const limpo = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
