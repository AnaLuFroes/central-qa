import { doc, runTransaction, serverTimestamp, setDoc, type DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { str } from './conv'

/** users/{uid}: dados da conta. A empresa e o perfil vêm de orgs/{orgId}/membros/{email}. */
export interface Usuario {
  orgId: string | null
  superAdmin: boolean
}

export const userRef = (uid: string) => doc(db, 'users', uid)

export const fromUsuario = (s: DocumentSnapshot): Usuario => ({
  orgId: str(s.get('orgId')) || null,
  superAdmin: s.get('superAdmin') === true,
})

/** Cria o perfil no primeiro acesso, sem sobrescrever um orgId gravado ao mesmo tempo pelo cadastro da empresa. */
export const criarUsuario = (uid: string, email: string, nome: string, foto: string) =>
  runTransaction(db, async (tx) => {
    const ref = userRef(uid)
    if ((await tx.get(ref)).exists()) return
    tx.set(ref, { email, nome, foto, orgId: null, criadoEm: serverTimestamp() })
  })

/** Liga a conta à empresa da qual a pessoa é dona. */
export const ligarEmpresa = (uid: string, orgId: string) => setDoc(userRef(uid), { orgId }, { merge: true })
