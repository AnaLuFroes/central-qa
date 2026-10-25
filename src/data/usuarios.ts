import { doc, serverTimestamp, setDoc, type DocumentSnapshot } from 'firebase/firestore'
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

export const criarUsuario = (uid: string, email: string, nome: string, foto: string) =>
  setDoc(userRef(uid), { email, nome, foto, orgId: null, criadoEm: serverTimestamp() })
