import { arrayUnion, deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { CenarioRef, CorpoFix, EventoHist, Ocorrencia, Repro } from '@/types'
import { contexto, corpo, limpo, ms, msOuNull, orgCol, orgDoc, str, type Snap } from './conv'
import { removerPrints } from './prints'

export const ocorrenciasCol = (orgId: string) => orgCol(orgId, 'ocorrencias')

const hist = (v: unknown): EventoHist[] =>
  Array.isArray(v)
    ? v
        .filter((h) => h && (h.ev === 'validado' || h.ev === 'reaberto' || h.ev === 'encerrado'))
        .map((h) => ({ ev: h.ev, em: ms(h.em), loteId: h.loteId ?? null }))
    : []

export const fromOcorrencia = (s: Snap): Ocorrencia => {
  const d = s.data()
  return {
    id: s.id,
    ...corpo(d),
    ...contexto(d),
    sis: str(d.sis),
    descricao: str(d.descricao),
    loteId: d.loteId ?? null,
    status: d.status === 'validado' || d.status === 'reaberto' || d.status === 'encerrado' ? d.status : '',
    hist: hist(d.hist),
    regFeatId: d.regFeatId ?? null,
    regEm: msOuNull(d.regEm),
    criadoPor: str(d.criadoPor),
    criadoEm: ms(d.criadoEm),
    atualizadoEm: ms(d.atualizadoEm),
  }
}

export type DadosOcorrencia = CorpoFix & {
  modulo: string
  descricao: string
  amb: string
  repro: Repro | ''
  massa: string
  assunto: string
  cenario: CenarioRef | null
}

/** id gerado no cliente para poder subir prints antes de salvar a ocorrência */
export const novoIdOcorrencia = (orgId: string) => doc(ocorrenciasCol(orgId)).id

/**
 * Cria a ocorrência reservando o código do sistema (SIGLA-NNN) na mesma transação.
 * Devolve o código gerado.
 */
export async function criarOcorrencia(orgId: string, sis: string, id: string, o: DadosOcorrencia, uid: string): Promise<string> {
  const sisRef = orgDoc(orgId, 'sistemas', sis)
  return runTransaction(db, async (tx) => {
    const s = await tx.get(sisRef)
    const seq = (s.get('seq') ?? 0) + 1
    const cod = (s.get('ini') || 'QA') + '-' + String(seq).padStart(3, '0')
    tx.update(sisRef, { seq })
    tx.set(
      orgDoc(orgId, 'ocorrencias', id),
      limpo({
        ...o,
        sis,
        cod,
        loteId: null,
        status: '',
        hist: [],
        regFeatId: null,
        regEm: null,
        criadoPor: uid,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      }),
    )
    return cod
  })
}

export const salvarOcorrencia = (orgId: string, id: string, o: DadosOcorrencia) =>
  updateDoc(orgDoc(orgId, 'ocorrencias', id), { ...o, atualizadoEm: serverTimestamp() })

export async function excluirOcorrencia(orgId: string, o: Ocorrencia) {
  await deleteDoc(orgDoc(orgId, 'ocorrencias', o.id))
  // Prints usados por um lote já enviado continuam valendo para o dev.
  if (!o.loteId && !o.hist.length) await removerPrints(orgId, o.prints)
}

const evento = (ev: EventoHist['ev'], loteId: string | null): EventoHist => ({ ev, em: Date.now(), loteId })

export const validarOcorrencia = (orgId: string, f: Ocorrencia) =>
  updateDoc(orgDoc(orgId, 'ocorrencias', f.id), { status: 'validado', hist: arrayUnion(evento('validado', f.loteId)) })

/** Reabre: sai do lote atual e entra no próximo. */
export const reabrirOcorrencia = (orgId: string, f: Ocorrencia) =>
  updateDoc(orgDoc(orgId, 'ocorrencias', f.id), { status: 'reaberto', loteId: null, hist: arrayUnion(evento('reaberto', f.loteId)) })

export const encerrarOcorrencia = (orgId: string, f: Ocorrencia) =>
  updateDoc(orgDoc(orgId, 'ocorrencias', f.id), { status: 'encerrado', hist: arrayUnion(evento('encerrado', f.loteId)) })

export const ligarRegressao = (orgId: string, id: string, featId: string) =>
  updateDoc(orgDoc(orgId, 'ocorrencias', id), { regFeatId: featId, regEm: Date.now() })
