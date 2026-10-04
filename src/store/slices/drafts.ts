import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Prioridade, Print, Tipo } from '@/types'

/** Formulário do modal de ocorrência (texto livre + campos estruturados). */
export interface FormOcorrencia {
  /** id do documento (gerado no cliente para ocorrências novas, para poder subir prints antes de salvar) */
  docId: string
  editando: boolean
  titulo: string
  modulo: string
  tipo: Tipo
  prioridade: Prioridade
  descricao: string
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

export interface DraftsState {
  /** rascunho da ocorrência nova (edições não viram rascunho) */
  ocorrencia: FormOcorrencia | null
  lote: FormLote | null
}

const initialState: DraftsState = { ocorrencia: null, lote: null }

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    setDraftOcorrencia: (s, a: PayloadAction<FormOcorrencia | null>) => void (s.ocorrencia = a.payload),
    setDraftLote: (s, a: PayloadAction<FormLote | null>) => void (s.lote = a.payload),
  },
})

export const { setDraftOcorrencia, setDraftLote } = draftsSlice.actions
export default draftsSlice.reducer
