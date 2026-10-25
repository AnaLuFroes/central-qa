import { addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { CaSt, Feature } from '@/types'
import { limpo, ms, msOuNull, orgCol, orgDoc, str, type Snap } from './conv'

export const featuresCol = (orgId: string) => orgCol(orgId, 'features')

export const fromFeature = (s: Snap): Feature => {
  const d = s.data()
  return {
    id: s.id,
    tipo: d.tipo === 'ca' ? 'ca' : 'casos',
    sis: str(d.sis),
    modulo: str(d.modulo),
    nome: str(d.nome),
    lang: d.lang === 'en' ? 'en' : 'pt',
    gherkin: str(d.gherkin),
    criadoEm: ms(d.criadoEm),
    caSt: d.caSt === 'revisao' || d.caSt === 'aprovado' ? d.caSt : 'rascunho',
    caCod: str(d.caCod),
    aprovEm: msOuNull(d.aprovEm),
    caId: d.caId ?? null,
    camada: d.camada === 'api' || d.camada === 'manual' ? d.camada : 'e2e',
  }
}

export type NovaFeature = Omit<Feature, 'id' | 'criadoEm' | 'aprovEm'>

export async function criarFeature(orgId: string, f: NovaFeature) {
  const ref = await addDoc(featuresCol(orgId), limpo({ ...f, aprovEm: null, criadoEm: serverTimestamp() }))
  return ref.id
}

export const salvarGherkin = (orgId: string, id: string, gherkin: string, nome: string) =>
  updateDoc(orgDoc(orgId, 'features', id), { gherkin, nome })

export const definirCaSt = (orgId: string, id: string, st: CaSt) =>
  updateDoc(orgDoc(orgId, 'features', id), { caSt: st, ...(st === 'aprovado' ? { aprovEm: serverTimestamp() } : {}) })

export const excluirFeature = (orgId: string, id: string) => deleteDoc(orgDoc(orgId, 'features', id))
