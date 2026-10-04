import { combineReducers, configureStore, type Reducer } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
  type Persistor,
} from 'redux-persist'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import auth from './slices/auth'
import data from './slices/data'
import drafts from './slices/drafts'
import ui from './slices/ui'

/** Adaptador assíncrono de localStorage (o `redux-persist/lib/storage` é CJS e quebra no Vite). */
const storage = {
  getItem: async (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem: async (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* cota cheia ou navegação privada: segue sem persistir */
    }
  },
  removeItem: async (k: string) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* idem */
    }
  },
}

const rootReducer = combineReducers({ auth, ui, drafts, data })

/**
 * Cria um store por usuário logado. O estado persistido fica em `persist:central-qa:<uid>`,
 * cifrado com AES por uma chave própria do usuário (ver `chavePersistencia`).
 * `data` fica fora: o Firestore é a fonte da verdade e já tem cache offline.
 */
export function makeStore(uid: string, secretKey: string) {
  const persisted = persistReducer(
    {
      key: `central-qa:${uid}`,
      version: 1,
      storage,
      blacklist: ['data'],
      transforms: [
        encryptTransform({
          secretKey,
          onError: (err) => {
            console.warn('[persist] cache ilegível, descartando', err)
            storage.removeItem(`persist:central-qa:${uid}`)
          },
        }),
      ],
    },
    // combineReducers tipa o estado inicial como Partial; o persistReducer espera o estado completo.
    rootReducer as Reducer<RootState>,
  )

  const store = configureStore({
    reducer: persisted,
    middleware: (gdm) =>
      gdm({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
  })
  const persistor: Persistor = persistStore(store)
  return { store, persistor }
}

export type AppStore = ReturnType<typeof makeStore>['store']
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore['dispatch']
