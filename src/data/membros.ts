import { collectionGroup, deleteDoc, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, type DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Membro, Perfil } from '@/types'
import { ms, orgCol, orgDoc, str, type Snap } from './conv'

export const membrosCol = (orgId: string) => orgCol(orgId, 'membros')

const perfil = (v: unknown): Perfil => (v === 'Admin' || v === 'Dev' ? v : 'QA')

export const fromMembro = (s: Snap | DocumentSnapshot): Membro => {
  const d = s.data() ?? {}
  return {
    email: s.id,
    nome: str(d.nome),
    perfil: perfil(d.perfil),
    foto: str(d.foto),
    uid: typeof d.uid === 'string' ? d.uid : null,
    criadoEm: ms(d.criadoEm),
  }
}

/** Convites para o e-mail (em qualquer empresa). Usado no primeiro acesso. */
export async function convitesDoEmail(email: string): Promise<{ orgId: string; membro: Membro }[]> {
  const snap = await getDocs(query(collectionGroup(db, 'membros'), where('email', '==', email.toLowerCase()), limit(5)))
  return snap.docs.map((s) => ({ orgId: s.ref.parent.parent!.id, membro: fromMembro(s) }))
}

/** Liga a conta ao convite: grava a empresa no perfil do usuário e o uid no convite. */
export async function aceitarConvite(orgId: string, email: string, uid: string, nome: string, foto: string) {
  const b = writeBatch(db)
  b.set(doc(db, 'users', uid), { orgId }, { merge: true })
  b.update(orgDoc(orgId, 'membros', email.toLowerCase()), { uid, ...(nome ? { nome } : {}), ...(foto ? { foto } : {}) })
  await b.commit()
}

export const adicionarMembro = (orgId: string, nome: string, email: string, p: Perfil) =>
  setDoc(orgDoc(orgId, 'membros', email.toLowerCase()), {
    email: email.toLowerCase(),
    nome: nome.trim(),
    perfil: p,
    foto: '',
    uid: null,
    criadoEm: serverTimestamp(),
  })

export const definirPerfil = (orgId: string, email: string, p: Perfil) => updateDoc(orgDoc(orgId, 'membros', email), { perfil: p })

export const removerMembro = (orgId: string, email: string) => deleteDoc(orgDoc(orgId, 'membros', email))

/** A própria pessoa muda o nome e a foto que a equipe vê. */
export const atualizarMeuPerfil = (orgId: string, email: string, p: { nome?: string; foto?: string }) =>
  updateDoc(orgDoc(orgId, 'membros', email.toLowerCase()), p)
