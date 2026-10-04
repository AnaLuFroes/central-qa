import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { ROLES } from '@/auth/roles'
import type { Role } from '@/types'

interface AuthState {
  user: User | null
  role: Role | null
  loading: boolean
  entrarComGoogle: () => Promise<void>
  entrarComEmail: (email: string, senha: string) => Promise<void>
  criarConta: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const roleValido = (r: unknown): Role => (ROLES.includes(r as Role) ? (r as Role) : 'pendente')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  // Nome digitado no cadastro: o perfil pode ser criado antes do updateProfile terminar.
  const nomeCadastro = useRef('')

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u)
        if (!u) {
          setRole(null)
          setLoading(false)
        } else setLoading(true)
      }),
    [],
  )

  // O nível é o campo `role` de users/{uid}, alterado à mão no Firestore (ou pelo admin).
  // No primeiro acesso o perfil não existe: criamos como pendente.
  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setRole(roleValido(snap.get('role')))
          setLoading(false)
          return
        }
        if (snap.metadata.fromCache) return
        setRole('pendente')
        setLoading(false)
        setDoc(ref, {
          email: user.email ?? '',
          nome: user.displayName || nomeCadastro.current,
          foto: user.photoURL ?? '',
          role: 'pendente',
          criadoEm: serverTimestamp(),
        }).catch((e) => console.warn('[auth] não foi possível criar o perfil', e))
      },
      () => {
        setRole('pendente')
        setLoading(false)
      },
    )
  }, [user])

  const value = useMemo<AuthState>(
    () => ({
      user,
      role,
      loading,
      entrarComGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      entrarComEmail: async (email, senha) => {
        await signInWithEmailAndPassword(auth, email, senha)
      },
      criarConta: async (nome, email, senha) => {
        nomeCadastro.current = nome
        const cred = await createUserWithEmailAndPassword(auth, email, senha)
        await updateProfile(cred.user, { displayName: nome })
      },
      sair: () => signOut(auth),
    }),
    [user, role, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
