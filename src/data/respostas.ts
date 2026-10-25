import { arrayUnion, setDoc, updateDoc } from 'firebase/firestore'
import { respId } from '@/lib/status'
import type { MsgThread, Resposta, Respostas, RespSt } from '@/types'
import { ms, msOuNull, orgCol, orgDoc, str, type Snap } from './conv'

export const respostasCol = (orgId: string) => orgCol(orgId, 'respostas')

const respSt = (v: unknown): RespSt | null =>
  v === 'corrigido' || v === 'naorep' || v === 'info' || v === 'esperado' || v === 'adiado' ? v : null

export const fromResposta = (s: Snap): Resposta => {
  const d = s.data()
  return {
    id: s.id,
    loteId: str(d.loteId),
    key: str(d.key),
    sis: str(d.sis),
    st: respSt(d.st),
    pr: str(d.pr),
    com: str(d.com),
    em: msOuNull(d.em),
    thread: Array.isArray(d.thread)
      ? d.thread.map(
          (m: Record<string, unknown>): MsgThread => ({
            by: m.by === 'qa' ? 'qa' : 'dev',
            st: respSt(m.st),
            pr: str(m.pr),
            txt: str(m.txt),
            em: ms(m.em),
            nome: str(m.nome),
          }),
        )
      : [],
  }
}

export function agruparRespostas(rs: Resposta[]): Respostas {
  const out: Respostas = {}
  for (const r of rs) (out[r.loteId] ??= {})[r.key] = r
  return out
}

/** Resposta do dev ao item do lote. Entra também na conversa. */
export async function responderComoDev(
  orgId: string,
  sis: string,
  loteId: string,
  key: string,
  v: { st: RespSt; pr: string; com: string },
  nome: string,
) {
  const em = Date.now()
  const msg: MsgThread = { by: 'dev', st: v.st, pr: v.pr, txt: v.com, em, nome }
  await setDoc(
    orgDoc(orgId, 'respostas', respId(loteId, key)),
    { loteId, key, sis, st: v.st, pr: v.pr, com: v.com, em, thread: arrayUnion(msg) },
    { merge: true },
  )
}

/** Resposta do QA na conversa: o item volta para o dev ("Nova resposta do QA"). */
export const responderComoQA = (orgId: string, loteId: string, key: string, txt: string, nome: string) =>
  updateDoc(orgDoc(orgId, 'respostas', respId(loteId, key)), {
    st: null,
    thread: arrayUnion({ by: 'qa', st: null, pr: '', txt, em: Date.now(), nome } satisfies MsgThread),
  })
