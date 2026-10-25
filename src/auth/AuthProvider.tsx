import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth } from '@/firebase'
import { orgDoc } from '@/data/conv'
import { aceitarConvite, convitesDoEmail, fromMembro } from '@/data/membros'
import { fromOrg, orgsCol } from '@/data/orgs'
import { criarUsuario, fromUsuario, userRef, type Usuario } from '@/data/usuarios'
import type { Membro, Org } from '@/types'

/**
 * Situação da conta depois do login:
 * - verificar: e-mail/senha ainda não verificado (as regras exigem e-mail verificado);
 * - sem-empresa: nenhum convite para este e-mail;
 * - pendente / suspensa: a empresa ainda não foi aprovada pela Central de QA, ou foi suspensa;
 * - ok: membro de empresa ativa.
 */
export type Situacao = 'verificar' | 'sem-empresa' | 'pendente' | 'suspensa' | 'ok'

interface AuthState {
  user: User | null
  loading: boolean
  usuario: Usuario | null
  org: Org | null
  membro: Membro | null
  situacao: Situacao | null
  superAdmin: boolean
  entrarComGoogle: () => Promise<void>
  entrarComEmail: (email: string, senha: string) => Promise<void>
  criarConta: (nome: string, email: string, senha: string) => Promise<User>
  reenviarVerificacao: () => Promise<void>
  conferirVerificacao: () => Promise<boolean>
  esqueciSenha: (email: string) => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authPronto, setAuthPronto] = useState(false)
  const [verificado, setVerificado] = useState(false)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [membro, setMembro] = useState<Membro | null>(null)
  const [orgPronta, setOrgPronta] = useState(false)
  // Nome digitado no cadastro: o perfil pode ser criado antes do updateProfile terminar.
  const nomeCadastro = useRef('')

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u)
        setVerificado(!!u?.emailVerified)
        setUsuario(null)
        setOrg(null)
        setMembro(null)
        setOrgPronta(false)
        setAuthPronto(true)
      }),
    [],
  )

  // users/{uid}: no primeiro acesso não existe e é criado sem empresa.
  useEffect(() => {
    if (!user) return
    return onSnapshot(
      userRef(user.uid),
      (snap) => {
        if (snap.exists()) {
          setUsuario(fromUsuario(snap))
          return
        }
        if (snap.metadata.fromCache) return
        setUsuario({ orgId: null, superAdmin: false })
        criarUsuario(user.uid, user.email ?? '', user.displayName || nomeCadastro.current, user.photoURL ?? '').catch((e) =>
          console.warn('[auth] não foi possível criar o perfil', e),
        )
      },
      () => setUsuario({ orgId: null, superAdmin: false }),
    )
  }, [user])

  // Sem empresa: procura um convite para o e-mail (só com e-mail verificado).
  useEffect(() => {
    if (!user?.email || !verificado || !usuario || usuario.orgId) {
      if (usuario && !usuario.orgId) setOrgPronta(true)
      return
    }
    let vivo = true
    setOrgPronta(false)
    convitesDoEmail(user.email)
      .then(async (cs) => {
        if (!vivo) return
        if (!cs.length) return setOrgPronta(true)
        await aceitarConvite(cs[0].orgId, user.email!, user.uid, cs[0].membro.nome ? '' : user.displayName || '', user.photoURL ?? '')
      })
      .catch((e) => {
        console.warn('[auth] não foi possível procurar convites', e)
        if (vivo) setOrgPronta(true)
      })
    return () => {
      vivo = false
    }
  }, [user, verificado, usuario])

  // Empresa e perfil na empresa.
  const orgId = usuario?.orgId ?? null
  useEffect(() => {
    if (!user?.email || !orgId) return
    let o = false
    let m = false
    setOrgPronta(false)
    const pronto = () => o && m && setOrgPronta(true)
    const subs = [
      onSnapshot(
        orgDoc(orgId, 'membros', user.email.toLowerCase()),
        (s) => {
          setMembro(s.exists() ? fromMembro(s) : null)
          m = true
          pronto()
        },
        () => {
          setMembro(null)
          m = true
          pronto()
        },
      ),
      onSnapshot(
        doc(orgsCol, orgId),
        (s) => {
          setOrg(s.exists() ? fromOrg(s) : null)
          o = true
          pronto()
        },
        () => {
          setOrg(null)
          o = true
          pronto()
        },
      ),
    ]
    return () => subs.forEach((u) => u())
  }, [user, orgId])

  const superAdmin = !!usuario?.superAdmin
  const situacao: Situacao | null = !user
    ? null
    : !verificado
      ? 'verificar'
      : !orgPronta
        ? null
        : !org || !membro
          ? 'sem-empresa'
          : org.status === 'pendente'
            ? 'pendente'
            : org.status === 'suspensa'
              ? 'suspensa'
              : 'ok'
  const loading = !authPronto || (!!user && (!usuario || (verificado && !orgPronta)))

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      usuario,
      org,
      membro,
      situacao,
      superAdmin,
      entrarComGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      entrarComEmail: async (email, senha) => {
        await signInWithEmailAndPassword(auth, email.trim(), senha)
      },
      criarConta: async (nome, email, senha) => {
        nomeCadastro.current = nome
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha)
        await updateProfile(cred.user, { displayName: nome })
        await sendEmailVerification(cred.user).catch(() => {})
        return cred.user
      },
      reenviarVerificacao: async () => {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser)
      },
      conferirVerificacao: async () => {
        const u = auth.currentUser
        if (!u) return false
        await reload(u)
        if (u.emailVerified) {
          // O token novo leva email_verified para as regras do Firestore.
          await u.getIdToken(true)
          setVerificado(true)
        }
        return u.emailVerified
      },
      esqueciSenha: (email) => sendPasswordResetEmail(auth, email.trim()),
      sair: () => signOut(auth),
    }),
    [user, loading, usuario, org, membro, situacao, superAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
