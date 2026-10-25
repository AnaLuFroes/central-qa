import { addDoc, deleteDoc, deleteField, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { ItemRodada, ResSt, ResultadoItem, Rodada } from '@/types'
import { ms, orgCol, orgDoc, str, strs, type Snap } from './conv'

export const rodadasCol = (orgId: string) => orgCol(orgId, 'rodadas')

export const fromRodada = (s: Snap): Rodada => {
  const d = s.data()
  return {
    id: s.id,
    sis: str(d.sis),
    nome: str(d.nome),
    amb: str(d.amb),
    criadoEm: ms(d.criadoEm),
    itens: (Array.isArray(d.itens) ? d.itens : []).map(
      (it: Record<string, unknown>): ItemRodada => ({
        key: str(it.key),
        featId: str(it.featId),
        featNome: str(it.featNome),
        modulo: str(it.modulo),
        titulo: str(it.titulo),
        outline: !!it.outline,
        bg: strs(it.bg),
        lines: strs(it.lines),
      }),
    ),
    res: (d.res ?? {}) as Record<string, ResultadoItem>,
  }
}

export async function criarRodada(orgId: string, sis: string, nome: string, amb: string, itens: ItemRodada[]) {
  const ref = await addDoc(rodadasCol(orgId), { sis, nome, amb, itens, res: {}, criadoEm: serverTimestamp() })
  return ref.id
}

/** Marca o resultado do cenário; repetir o mesmo resultado limpa a marcação. */
export function definirResultado(orgId: string, r: Rodada, key: string, st: ResSt) {
  const atual = r.res[key] ?? {}
  return updateDoc(orgDoc(orgId, 'rodadas', r.id), { [`res.${key}.st`]: atual.st === st ? deleteField() : st })
}

/** Liga a ocorrência registrada ao cenário que falhou. */
export const ligarFalha = (orgId: string, rodadaId: string, key: string, fixId: string) =>
  updateDoc(orgDoc(orgId, 'rodadas', rodadaId), { [`res.${key}.st`]: 'falhou', [`res.${key}.fixId`]: fixId })

export const excluirRodada = (orgId: string, id: string) => deleteDoc(orgDoc(orgId, 'rodadas', id))
