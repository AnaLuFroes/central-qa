import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Modulo } from '@/types'
import { ms, type Snap } from './conv'

export const modulosCol = collection(db, 'modulos')

export const fromModulo = (s: Snap): Modulo => {
  const d = s.data()
  return { id: s.id, nome: d.nome ?? '', emoji: d.emoji ?? '', cor: d.cor ?? null, criadoEm: ms(d.criadoEm) }
}

export interface DadosModulo {
  nome: string
  emoji: string
  cor: number | null
}

export async function criarModulo(m: DadosModulo) {
  const ref = await addDoc(modulosCol, { ...m, nomeLower: m.nome.toLowerCase(), criadoEm: serverTimestamp() })
  return ref.id
}

export const salvarModulo = (id: string, m: DadosModulo) =>
  updateDoc(doc(db, 'modulos', id), { ...m, nomeLower: m.nome.toLowerCase() })

export const excluirModulo = (id: string) => deleteDoc(doc(db, 'modulos', id))
