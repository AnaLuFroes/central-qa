import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import type { Persistor } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import { useAuth } from '@/auth/AuthProvider'
import { DataSync } from '@/data/DataSync'
import { makeStore, type AppStore } from '@/store'
import { chavePersistencia } from '@/store/chave'
import { setPerfil } from '@/store/slices/auth'
import { Carregando } from '@/components/Carregando'

const SessaoContext = createContext<{ sair: () => Promise<void> } | null>(null)

/** Monta o store Redux (com persist cifrado) só depois do login, um por usuário. */
export function SessionStore({ children }: { children: ReactNode }) {
  const { user, membro, org, situacao, sair } = useAuth()
  const [sessao, setSessao] = useState<{ uid: string; store: AppStore; persistor: Persistor } | null>(null)

  useEffect(() => {
    if (!user) {
      setSessao(null)
      return
    }
    let vivo = true
    chavePersistencia(user.uid).then((chave) => {
      if (vivo) setSessao({ uid: user.uid, ...makeStore(user.uid, chave) })
    })
    return () => {
      vivo = false
    }
  }, [user])

  useEffect(() => {
    if (!sessao || !user) return
    sessao.store.dispatch(
      setPerfil({
        uid: user.uid,
        nome: membro?.nome || user.displayName || user.email || '',
        email: user.email || '',
        foto: membro?.foto || user.photoURL || '',
        orgId: situacao === 'ok' ? org?.id ?? null : null,
        perfil: situacao === 'ok' ? membro?.perfil ?? null : null,
      }),
    )
  }, [sessao, user, membro, org, situacao])

  if (!user) return <>{children}</>
  if (!sessao || sessao.uid !== user.uid) return <Carregando />

  const sairELimpar = async () => {
    sessao.persistor.pause()
    await sessao.persistor.purge()
    await sair()
  }

  return (
    <SessaoContext.Provider value={{ sair: sairELimpar }}>
      <Provider store={sessao.store}>
        <PersistGate loading={<Carregando />} persistor={sessao.persistor}>
          <DataSync />
          {children}
        </PersistGate>
      </Provider>
    </SessaoContext.Provider>
  )
}

/** Logout que também apaga o estado persistido do usuário. */
export function useSair() {
  const ctx = useContext(SessaoContext)
  const { sair } = useAuth()
  return ctx?.sair ?? sair
}
