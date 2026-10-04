import { collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Role, Usuario } from '@/types'
import { ms, type Snap } from './conv'

export const usuariosCol = collection(db, 'users')

export const fromUsuario = (s: Snap): Usuario => {
  const d = s.data()
  return {
    uid: s.id,
    email: d.email ?? '',
    nome: d.nome ?? '',
    foto: d.foto ?? '',
    role: d.role ?? 'pendente',
    criadoEm: ms(d.criadoEm),
  }
}

/** Só o admin consegue (regras do Firestore). Também dá para mudar o campo `role` direto no console. */
export const definirNivel = (uid: string, role: Role, adminUid: string) =>
  updateDoc(doc(usuariosCol, uid), { role, roleAlteradoPor: adminUid, roleAlteradoEm: serverTimestamp() })
