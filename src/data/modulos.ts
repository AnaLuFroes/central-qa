import { addDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Feature, Modulo, Ocorrencia } from '@/types'
import { ms, orgCol, orgDoc, str, type Snap } from './conv'

export const modulosCol = (orgId: string) => orgCol(orgId, 'modulos')

export const fromModulo = (s: Snap): Modulo => {
  const d = s.data()
  return { id: s.id, sis: str(d.sis), nome: str(d.nome), emoji: str(d.emoji), cor: d.cor ?? null, criadoEm: ms(d.criadoEm) }
}

export interface DadosModulo {
  nome: string
  emoji: string
  cor: number | null
}

export async function criarModulo(orgId: string, sis: string, m: DadosModulo) {
  const ref = await addDoc(modulosCol(orgId), { ...m, sis, nomeLower: m.nome.toLowerCase(), criadoEm: serverTimestamp() })
  return ref.id
}

/** Salva o módulo. Se o nome mudou, renomeia junto as ocorrências e funcionalidades do módulo. */
export async function salvarModulo(
  orgId: string,
  m: Modulo,
  dados: DadosModulo,
  ocorrencias: Ocorrencia[],
  features: Feature[],
) {
  const b = writeBatch(db)
  b.update(orgDoc(orgId, 'modulos', m.id), { ...dados, nomeLower: dados.nome.toLowerCase() })
  if (m.nome !== dados.nome) {
    for (const o of ocorrencias.filter((x) => x.sis === m.sis && x.modulo === m.nome))
      b.update(orgDoc(orgId, 'ocorrencias', o.id), { modulo: dados.nome })
    for (const f of features.filter((x) => x.sis === m.sis && x.modulo === m.nome))
      b.update(orgDoc(orgId, 'features', f.id), { modulo: dados.nome })
  }
  await b.commit()
}

export const excluirModulo = (orgId: string, id: string) => deleteDoc(orgDoc(orgId, 'modulos', id))

/** Cria o módulo se ainda não existir um com esse nome no sistema. */
export async function garantirModulo(orgId: string, sis: string, nome: string, modulos: Modulo[]) {
  if (modulos.some((m) => m.sis === sis && m.nome.toLowerCase() === nome.toLowerCase())) return
  await criarModulo(orgId, sis, { nome, emoji: '', cor: null })
}
