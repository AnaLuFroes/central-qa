// Backup da empresa em JSON: sistemas, módulos, ocorrências, lotes, respostas, casos de teste e rodadas.
// Prints, equipe e configuração de IA ficam de fora.
import { doc, writeBatch, type WriteBatch } from 'firebase/firestore'
import { db } from '@/firebase'
import type { DataState } from '@/store/slices/data'
import type { Feature, Lote, Modulo, Ocorrencia, Resposta, Rodada, Sistema } from '@/types'

export interface Backup {
  v: 2
  geradoEm: string
  sistemas: Sistema[]
  modulos: Modulo[]
  ocorrencias: Ocorrencia[]
  lotes: Lote[]
  respostas: Resposta[]
  features: Feature[]
  rodadas: Rodada[]
}

export function gerarBackup(d: DataState): Backup {
  return {
    v: 2,
    geradoEm: new Date().toISOString(),
    sistemas: d.sistemas,
    modulos: d.modulos,
    ocorrencias: d.ocorrencias,
    lotes: d.lotes,
    respostas: Object.values(d.respostas).flatMap((m) => Object.values(m)),
    features: d.features,
    rodadas: d.rodadas,
  }
}

export const nomeBackup = () => `central-qa-backup-${new Date().toISOString().slice(0, 10)}.json`

/** Lê e confere o arquivo de backup. Lança erro se não for um backup da Central de QA. */
export function lerBackup(texto: string): Backup {
  const o = JSON.parse(texto) as Partial<Backup>
  const arr = (x: unknown) => Array.isArray(x)
  if (!o || o.v !== 2 || !arr(o.ocorrencias) || !arr(o.sistemas) || !arr(o.lotes)) throw new Error('Arquivo de backup inválido')
  return {
    v: 2,
    geradoEm: String(o.geradoEm ?? ''),
    sistemas: o.sistemas!,
    modulos: o.modulos ?? [],
    ocorrencias: o.ocorrencias!,
    lotes: o.lotes!,
    respostas: o.respostas ?? [],
    features: o.features ?? [],
    rodadas: o.rodadas ?? [],
  }
}

/**
 * Restaura o backup por cima dos dados atuais (mesmos ids são substituídos; nada é apagado).
 * Grava em lotes de 400 operações.
 */
export async function restaurarBackup(orgId: string, b: Backup) {
  const ops: ((w: WriteBatch) => void)[] = []
  const put = (col: string, id: string, dados: object) =>
    ops.push((w) => w.set(doc(db, 'orgs', orgId, col, id), dados))
  for (const { id, ...x } of b.sistemas) put('sistemas', id, x)
  for (const { id, ...x } of b.modulos) if (id) put('modulos', id, { ...x, nomeLower: x.nome.toLowerCase() })
  for (const { id, ...x } of b.ocorrencias) put('ocorrencias', id, x)
  for (const { id, ...x } of b.lotes) put('lotes', id, x)
  for (const { id, ...x } of b.respostas) put('respostas', id, x)
  for (const { id, ...x } of b.features) put('features', id, x)
  for (const { id, ...x } of b.rodadas) put('rodadas', id, x)
  for (let i = 0; i < ops.length; i += 400) {
    const w = writeBatch(db)
    ops.slice(i, i + 400).forEach((op) => op(w))
    await w.commit()
  }
}
