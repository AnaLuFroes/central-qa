import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CenarioRef, CorpoFix, Repro } from '@/types'

/** Dados para abrir o modal de ocorrência já preenchido (duplicar ou falha na rodada). */
export type PresetFix = Partial<CorpoFix> & {
  modulo?: string
  amb?: string
  cenario?: CenarioRef | null
  descricao?: string
  repro?: Repro | ''
  massa?: string
  assunto?: string
}

export type Modal =
  | { kind: 'fix'; fixId?: string; modulo?: string; preset?: PresetFix; origin?: { rid: string; key: string } }
  | { kind: 'mod'; moduloId?: string; nome?: string }
  | { kind: 'lote' }
  | { kind: 'link'; loteId: string }
  | { kind: 'caso'; mode: 'ca' | 'casos'; modulo?: string; caId?: string }
  | { kind: 'rodada' }
  | { kind: 'busca' }
  | { kind: 'atalhos' }
  | { kind: 'img'; printId: string }

const modalSlice = createSlice({
  name: 'modal',
  initialState: null as Modal | null,
  reducers: {
    abrirModal: (_s, a: PayloadAction<Modal>) => a.payload,
    fecharModal: () => null,
  },
})

export const { abrirModal, fecharModal } = modalSlice.actions
export default modalSlice.reducer
