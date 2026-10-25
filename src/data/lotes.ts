import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'
import { modOf, pad } from '@/lib/format'
import { respId } from '@/lib/status'
import type { ItemLote, Lote, Ocorrencia, Respostas, SecaoLote } from '@/types'
import { contexto, corpo, ms, orgCol, orgDoc, str, type Snap } from './conv'

export const lotesCol = (orgId: string) => orgCol(orgId, 'lotes')

export const fromLote = (s: Snap): Lote => {
  const d = s.data()
  const secoes: SecaoLote[] = (d.secoes ?? []).map((sc: { nome: string; itens: Record<string, unknown>[] }) => ({
    nome: str(sc.nome),
    itens: (sc.itens ?? []).map((it) => ({ ...corpo(it), ...contexto(it), key: String(it.key), ocorrenciaId: String(it.ocorrenciaId) })),
  }))
  return {
    id: s.id,
    sis: str(d.sis),
    titulo: str(d.titulo),
    eyebrow: str(d.eyebrow),
    intro: str(d.intro),
    criadoEm: ms(d.criadoEm),
    criadoPor: str(d.criadoPor),
    total: d.total ?? secoes.reduce((n, sc) => n + sc.itens.length, 0),
    secoes,
  }
}

/** Agrupa por módulo, na ordem em que aparecem, e numera FIX 01, FIX 02… em todo o lote. */
export function buildSecoes(lista: Ocorrencia[]): SecaoLote[] {
  const grupos = new Map<string, Ocorrencia[]>()
  for (const o of lista) {
    const k = modOf(o)
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(o)
  }
  let n = 0
  return [...grupos.entries()].map(([nome, itens]) => ({
    nome,
    itens: itens.map(
      (o): ItemLote => ({
        key: 'fix-' + pad(++n),
        ocorrenciaId: o.id,
        titulo: o.titulo,
        tipo: o.tipo,
        prioridade: o.prioridade,
        onde: o.onde,
        passos: o.passos,
        atual: o.atual,
        erro: o.erro,
        esperado: o.esperado,
        obs: o.obs,
        prints: o.prints,
        cod: o.cod,
        modulo: o.modulo,
        amb: o.amb,
        repro: o.repro,
        massa: o.massa,
        cenario: o.cenario,
        assunto: o.assunto,
      }),
    ),
  }))
}

export interface DadosLote {
  titulo: string
  eyebrow: string
  intro: string
}

/** Cria o lote com uma cópia das ocorrências e marca cada uma como enviada nele. */
export async function criarLote(orgId: string, sis: string, dados: DadosLote, escolhidas: Ocorrencia[], uid: string) {
  const ref = doc(lotesCol(orgId))
  const secoes = buildSecoes(escolhidas)
  const b = writeBatch(db)
  b.set(ref, { ...dados, sis, secoes, total: escolhidas.length, criadoPor: uid, criadoEm: serverTimestamp() })
  for (const o of escolhidas)
    b.update(orgDoc(orgId, 'ocorrencias', o.id), { loteId: ref.id, ...(o.status === 'reaberto' ? { status: '' } : {}) })
  await b.commit()
  return ref.id
}

/** Exclui o lote e as respostas do dev, e devolve as ocorrências para "não enviadas". */
export async function excluirLote(orgId: string, lote: Lote, ocorrencias: Ocorrencia[], resp: Respostas) {
  const b = writeBatch(db)
  for (const key of Object.keys(resp[lote.id] ?? {})) b.delete(orgDoc(orgId, 'respostas', respId(lote.id, key)))
  for (const o of ocorrencias.filter((x) => x.loteId === lote.id)) b.update(orgDoc(orgId, 'ocorrencias', o.id), { loteId: null })
  b.delete(orgDoc(orgId, 'lotes', lote.id))
  await b.commit()
}

export const linkDoLote = (id: string) => `${window.location.origin}/lote/${id}`
