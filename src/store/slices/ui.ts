import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type FiltroTipo = 'all' | 'erro' | 'melhoria' | 'pend'
export type FiltroRep = 'all' | 'open' | 'done'

export interface UiState {
  busca: string
  fTipo: FiltroTipo
  fRep: FiltroRep
  /** ocorrências expandidas na página do módulo */
  abertas: Record<string, boolean>
  /** itens recolhidos na página do lote: `${loteId}/${fixKey}` */
  recolhidos: Record<string, boolean>
  /** seleção para gerar lote */
  selecao: Record<string, boolean>
}

const initialState: UiState = { busca: '', fTipo: 'all', fRep: 'all', abertas: {}, recolhidos: {}, selecao: {} }

const toggle = (m: Record<string, boolean>, k: string) => {
  if (m[k]) delete m[k]
  else m[k] = true
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBusca: (s, a: PayloadAction<string>) => void (s.busca = a.payload),
    setFTipo: (s, a: PayloadAction<FiltroTipo>) => void (s.fTipo = a.payload),
    setFRep: (s, a: PayloadAction<FiltroRep>) => void (s.fRep = a.payload),
    toggleAberta: (s, a: PayloadAction<string>) => toggle(s.abertas, a.payload),
    abrir: (s, a: PayloadAction<string>) => void (s.abertas[a.payload] = true),
    toggleRecolhido: (s, a: PayloadAction<string>) => toggle(s.recolhidos, a.payload),
    setRecolhidos: (s, a: PayloadAction<{ keys: string[]; recolher: boolean }>) => {
      for (const k of a.payload.keys) {
        if (a.payload.recolher) s.recolhidos[k] = true
        else delete s.recolhidos[k]
      }
    },
    toggleSelecao: (s, a: PayloadAction<string>) => toggle(s.selecao, a.payload),
    selecionar: (s, a: PayloadAction<string[]>) => {
      for (const id of a.payload) s.selecao[id] = true
    },
    limparSelecao: (s) => void (s.selecao = {}),
  },
})

export const {
  setBusca,
  setFTipo,
  setFRep,
  toggleAberta,
  abrir,
  toggleRecolhido,
  setRecolhidos,
  toggleSelecao,
  selecionar,
  limparSelecao,
} = uiSlice.actions
export default uiSlice.reducer
