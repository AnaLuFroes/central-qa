import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { CorpoFix, Ocorrencia } from '@/types'
import { corpo, ms, type Snap } from './conv'
import { removerPrints } from './prints'

export const ocorrenciasCol = collection(db, 'ocorrencias')

export const fromOcorrencia = (s: Snap): Ocorrencia => {
  const d = s.data()
  return {
    id: s.id,
    ...corpo(d),
    moduloId: d.moduloId ?? '',
    descricao: d.descricao ?? '',
    loteId: d.loteId ?? null,
    criadoPor: d.criadoPor ?? '',
    criadoEm: ms(d.criadoEm),
    atualizadoEm: ms(d.atualizadoEm),
  }
}

export type DadosOcorrencia = CorpoFix & { moduloId: string; descricao: string }

export async function criarOcorrencia(o: DadosOcorrencia, uid: string, id?: string) {
  const base = { ...o, loteId: null, criadoPor: uid, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() }
  if (id) {
    await setDoc(doc(db, 'ocorrencias', id), base)
    return id
  }
  return (await addDoc(ocorrenciasCol, base)).id
}

export const salvarOcorrencia = (id: string, o: DadosOcorrencia) =>
  updateDoc(doc(db, 'ocorrencias', id), { ...o, atualizadoEm: serverTimestamp() })

export async function excluirOcorrencia(o: Ocorrencia) {
  await deleteDoc(doc(db, 'ocorrencias', o.id))
  // Prints usados por um lote já enviado continuam valendo para o dev.
  if (!o.loteId) await removerPrints(o.prints)
}

/** id gerado no cliente para poder subir prints antes de salvar a ocorrência */
export const novoIdOcorrencia = () => doc(ocorrenciasCol).id
