import { collection, doc, serverTimestamp, updateDoc, writeBatch, type DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Org, StatusOrg } from '@/types'
import { ms, msOuNull, str, type Snap } from './conv'

export const orgsCol = collection(db, 'orgs')

export const fromOrg = (s: Snap | DocumentSnapshot): Org => {
  const d = s.data() ?? {}
  return {
    id: s.id,
    nome: str(d.nome),
    status: d.status === 'ativa' || d.status === 'suspensa' ? d.status : 'pendente',
    donoUid: str(d.donoUid),
    donoEmail: str(d.donoEmail),
    criadoEm: ms(d.criadoEm),
    aprovadoEm: msOuNull(d.aprovadoEm),
  }
}

export interface NovaEmpresa {
  empresa: string
  nome: string
  email: string
  uid: string
  sistemas: { nome: string; ini: string; cor: number }[]
}

/**
 * Cria a empresa (pendente de aprovação), o administrador e os sistemas, tudo de uma vez.
 * As regras do Firestore conferem que quem cria é o dono e o próprio administrador.
 */
export async function criarEmpresa(v: NovaEmpresa): Promise<string> {
  const ref = doc(orgsCol)
  const email = v.email.trim().toLowerCase()
  const b = writeBatch(db)
  b.set(ref, { nome: v.empresa.trim(), status: 'pendente', donoUid: v.uid, donoEmail: email, criadoEm: serverTimestamp() })
  b.set(doc(ref, 'membros', email), { email, nome: v.nome.trim(), perfil: 'Admin', foto: '', uid: v.uid, criadoEm: serverTimestamp() })
  for (const s of v.sistemas) b.set(doc(collection(ref, 'sistemas')), { nome: s.nome, ini: s.ini, cor: s.cor, capa: '', seq: 0 })
  b.set(doc(db, 'users', v.uid), { orgId: ref.id }, { merge: true })
  await b.commit()
  return ref.id
}

/** Só administradores da plataforma (regras do Firestore). */
export const definirStatusOrg = (id: string, status: StatusOrg, uid: string) =>
  updateDoc(doc(orgsCol, id), {
    status,
    ...(status === 'ativa' ? { aprovadoPor: uid, aprovadoEm: serverTimestamp() } : {}),
  })
