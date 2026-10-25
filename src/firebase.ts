import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const env = import.meta.env
// VITE_EMULADORES=1 usa os emuladores locais de Auth e Firestore (npm run emuladores).
const emuladores = env.VITE_EMULADORES === '1'

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-central-qa',
  appId: env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: emuladores ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (emuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
