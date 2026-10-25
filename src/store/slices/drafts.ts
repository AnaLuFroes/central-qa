import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Prioridade, Print, Repro, RespSt, Tipo } from '@/types'

/** Formulário do modal de ocorrência (texto livre + campos estruturados). */
export interface FormOcorrencia {
  /** id do documento (gerado no cliente para ocorrências novas, para poder subir prints antes de salvar) */
  docId: string
  editando: boolean
  titulo: string
  modulo: string
  tipo: Tipo
  prioridade: Prioridade
  assunto: string
  descricao: string
  amb: string
  repro: Repro | ''
  massa: string
  onde: string
  passosT: string
  atual: string
  erro: string
  espT: string
  obs: string
  prints: Print[]
  struct: boolean
}

export interface FormLote {
  titulo: string
  eyebrow: string
  intro: string
}

export interface DraftResposta {
  st: RespSt | null
  pr: string
  com: string
}

export interface DraftsState {
  /** rascunho da ocorrência nova (edições não viram rascunho) */
  ocorrencia: FormOcorrencia | null
  lote: FormLote | null
  /** respostas do dev em edição: `${loteId}/${key}` */
  respostas: Record<string, DraftResposta>
  /** respostas do QA na conversa: id da ocorrência */
  replies: Record<string, string>
}

const initialState: DraftsState = { ocorrencia: null, lote: null, respostas: {}, replies: {} }

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    setDraftOcorrencia: (s, a: PayloadAction<FormOcorrencia | null>) => void (s.ocorrencia = a.payload),
    setDraftLote: (s, a: PayloadAction<FormLote | null>) => void (s.lote = a.payload),
    setDraftResposta: (s, a: PayloadAction<{ ck: string; v: DraftResposta | null }>) => {
      if (a.payload.v) s.respostas[a.payload.ck] = a.payload.v
      else delete s.respostas[a.payload.ck]
    },
    setReply: (s, a: PayloadAction<{ id: string; txt: string }>) => {
      if (a.payload.txt) s.replies[a.payload.id] = a.payload.txt
      else delete s.replies[a.payload.id]
    },
  },
})

export const { setDraftOcorrencia, setDraftLote, setDraftResposta, setReply } = draftsSlice.actions
export default draftsSlice.reducer
