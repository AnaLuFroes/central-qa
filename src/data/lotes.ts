import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { pad } from '@/lib/format'
import type { ItemLote, Lote, Modulo, Ocorrencia, SecaoLote } from '@/types'
import { corpo, ms, type Snap } from './conv'

export const lotesCol = collection(db, 'lotes')

export const fromLote = (s: Snap): Lote => {
  const d = s.data()
  const secoes: SecaoLote[] = (d.secoes ?? []).map((sc: { nome: string; itens: Record<string, unknown>[] }) => ({
    nome: sc.nome,
    itens: (sc.itens ?? []).map((it) => ({ ...corpo(it), key: String(it.key), ocorrenciaId: String(it.ocorrenciaId) })),
  }))
  return {
    id: s.id,
    titulo: d.titulo ?? '',
    eyebrow: d.eyebrow ?? '',
    intro: d.intro ?? '',
    criadoEm: ms(d.criadoEm),
    criadoPor: d.criadoPor ?? '',
    total: d.total ?? secoes.reduce((n, sc) => n + sc.itens.length, 0),
    secoes,
  }
}

/** Agrupa por módulo (ordem alfabética) e numera FIX 01, FIX 02… na ordem das seções. */
export function buildSecoes(lista: Ocorrencia[], modulos: Modulo[]): SecaoLote[] {
  const nomeDe = (id: string) => modulos.find((m) => m.id === id)?.nome || 'Geral'
  const grupos = new Map<string, Ocorrencia[]>()
  for (const o of lista) {
    const k = nomeDe(o.moduloId)
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(o)
  }
  let n = 0
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([nome, itens]) => ({
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
        }),
      ),
    }))
}

export interface DadosLote {
  titulo: string
  eyebrow: string
  intro: string
}

export async function criarLote(dados: DadosLote, escolhidas: Ocorrencia[], modulos: Modulo[], uid: string) {
  const ref = doc(lotesCol)
  const secoes = buildSecoes(escolhidas, modulos)
  const batch = writeBatch(db)
  batch.set(ref, {
    ...dados,
    secoes,
    total: escolhidas.length,
    criadoPor: uid,
    criadoEm: serverTimestamp(),
  })
  for (const o of escolhidas) batch.update(doc(db, 'ocorrencias', o.id), { loteId: ref.id })
  await batch.commit()
  return ref.id
}

/** Exclui o lote, apaga o progresso do dev e devolve as ocorrências para "não enviadas". */
export async function excluirLote(lote: Lote, ocorrencias: Ocorrencia[]) {
  const prog = await getDocs(collection(db, 'lotes', lote.id, 'progresso'))
  const batch = writeBatch(db)
  prog.forEach((p) => batch.delete(p.ref))
  for (const o of ocorrencias.filter((x) => x.loteId === lote.id))
    batch.update(doc(db, 'ocorrencias', o.id), { loteId: null })
  batch.delete(doc(db, 'lotes', lote.id))
  await batch.commit()
}

export async function marcarFix(loteId: string, key: string, feito: boolean, uid: string) {
  const ref = doc(db, 'lotes', loteId, 'progresso', key)
  if (feito) await setDoc(ref, { feito: true, por: uid, em: serverTimestamp() })
  else await deleteDoc(ref)
}

export const linkDoLote = (id: string) => `${window.location.origin}/lote/${id}`
