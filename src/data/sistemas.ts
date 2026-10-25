import { deleteDoc, doc, runTransaction, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Sistema } from '@/types'
import { orgCol, orgDoc, str, type Snap } from './conv'

export const sistemasCol = (orgId: string) => orgCol(orgId, 'sistemas')

export const fromSistema = (s: Snap): Sistema => {
  const d = s.data()
  return {
    id: s.id,
    nome: str(d.nome),
    ini: str(d.ini),
    cor: typeof d.cor === 'number' ? d.cor : 0,
    capa: str(d.capa),
    seq: typeof d.seq === 'number' ? d.seq : 0,
  }
}

export interface RascunhoSistema {
  id: string | null
  nome: string
  ini: string
  cor: number
}

/** Aplica a lista editada na tela "Sistemas da empresa": cria, altera e remove. */
export async function salvarSistemas(orgId: string, atuais: Sistema[], lista: RascunhoSistema[]) {
  const ops: Promise<unknown>[] = []
  for (const s of lista) {
    if (!s.id) ops.push(setDoc(doc(sistemasCol(orgId)), { nome: s.nome, ini: s.ini, cor: s.cor, capa: '', seq: 0 }))
    else {
      const a = atuais.find((x) => x.id === s.id)
      if (a && (a.nome !== s.nome || a.ini !== s.ini || a.cor !== s.cor))
        ops.push(updateDoc(orgDoc(orgId, 'sistemas', s.id), { nome: s.nome, ini: s.ini, cor: s.cor }))
    }
  }
  for (const a of atuais) if (!lista.some((s) => s.id === a.id)) ops.push(deleteDoc(orgDoc(orgId, 'sistemas', a.id)))
  await Promise.all(ops)
}

export const definirCapaSistema = (orgId: string, id: string, capa: string) => updateDoc(orgDoc(orgId, 'sistemas', id), { capa })

/** Reserva o próximo código (SIGLA-001) do sistema numa transação, sem repetir números. */
export async function proximoCodigo(orgId: string, sisId: string): Promise<string> {
  const ref = orgDoc(orgId, 'sistemas', sisId)
  return runTransaction(db, async (tx) => {
    const s = await tx.get(ref)
    const seq = (s.get('seq') ?? 0) + 1
    tx.update(ref, { seq })
    return (s.get('ini') || 'QA') + '-' + String(seq).padStart(3, '0')
  })
}
