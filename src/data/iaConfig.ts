import { doc, serverTimestamp, setDoc, type DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import type { ConfigIA, ProvedorIA } from '@/types'
import { msOuNull, str } from './conv'

/** orgs/{orgId}/config/ia — lido por QA e Admin, gravado só pelo Admin. */
export const iaRef = (orgId: string) => doc(db, 'orgs', orgId, 'config', 'ia')

const provedor = (v: unknown): ProvedorIA => (v === 'openai' || v === 'google' || v === 'compat' ? v : 'anthropic')

export const fromConfigIA = (s: DocumentSnapshot): ConfigIA | null => {
  if (!s.exists()) return null
  const d = s.data()
  return {
    provedor: provedor(d.provedor),
    modelo: str(d.modelo),
    apiKey: str(d.apiKey),
    baseURL: str(d.baseURL),
    atualizadoPor: str(d.atualizadoPor),
    em: msOuNull(d.em),
  }
}

export const salvarConfigIA = (orgId: string, c: Pick<ConfigIA, 'provedor' | 'modelo' | 'apiKey' | 'baseURL'>, uid: string) =>
  setDoc(iaRef(orgId), { ...c, atualizadoPor: uid, em: serverTimestamp() })
