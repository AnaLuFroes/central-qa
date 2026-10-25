import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type FiltroTipo = 'all' | 'erro' | 'melhoria' | 'pend'
export type FiltroRep = 'all' | 'open' | 'done'
export type FiltroRod = 'all' | 'pend' | 'passou' | 'falhou' | 'bloqueado'
export type FiltroFila = 'all' | 'resp' | 'ret' | 'reab' | 'reg'
export type AbaCasos = 'ca' | 'feats' | 'rodadas'
export type TipoBusca = 'all' | 'fix' | 'feat' | 'rod' | 'lote' | 'mod'

export interface UiState {
  /** sistema aberto */
  sis: string | null
  /** filtro da grade de módulos */
  busca: string
  fTipo: FiltroTipo
  fAss: string
  modGroup: 'assunto' | 'lista'
  fRep: FiltroRep
  fRod: FiltroRod
  painelF: FiltroFila
  casoTab: AbaCasos
  casoMod: string | null
  qType: TipoBusca
  /** ocorrências expandidas */
  abertas: Record<string, boolean>
  /** itens recolhidos na página do lote: `${loteId}/${fixKey}` */
  recolhidos: Record<string, boolean>
  /** seleção para gerar lote */
  selecao: Record<string, boolean>
  openFeat: Record<string, boolean>
  openScen: Record<string, boolean>
  /** último ambiente informado (sugestão para a próxima ocorrência ou rodada) */
  lastAmb: string
}

const initialState: UiState = {
  sis: null,
  busca: '',
  fTipo: 'all',
  fAss: 'all',
  modGroup: 'assunto',
  fRep: 'all',
  fRod: 'all',
  painelF: 'all',
  casoTab: 'ca',
  casoMod: null,
  qType: 'all',
  abertas: {},
  recolhidos: {},
  selecao: {},
  openFeat: {},
  openScen: {},
  lastAmb: '',
}

const toggle = (m: Record<string, boolean>, k: string) => {
  if (m[k]) delete m[k]
  else m[k] = true
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSis: (s, a: PayloadAction<string | null>) => {
      if (s.sis !== a.payload) {
        s.selecao = {}
        s.casoMod = null
        s.busca = ''
      }
      s.sis = a.payload
    },
    setBusca: (s, a: PayloadAction<string>) => void (s.busca = a.payload),
    setFTipo: (s, a: PayloadAction<FiltroTipo>) => void (s.fTipo = a.payload),
    setFAss: (s, a: PayloadAction<string>) => void (s.fAss = a.payload),
    setModGroup: (s, a: PayloadAction<UiState['modGroup']>) => void (s.modGroup = a.payload),
    setFRep: (s, a: PayloadAction<FiltroRep>) => void (s.fRep = a.payload),
    setFRod: (s, a: PayloadAction<FiltroRod>) => void (s.fRod = a.payload),
    setPainelF: (s, a: PayloadAction<FiltroFila>) => void (s.painelF = a.payload),
    setCasoTab: (s, a: PayloadAction<AbaCasos>) => void (s.casoTab = a.payload),
    setCasoMod: (s, a: PayloadAction<string | null>) => void (s.casoMod = a.payload),
    setQType: (s, a: PayloadAction<TipoBusca>) => void (s.qType = a.payload),
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
    toggleFeat: (s, a: PayloadAction<string>) => toggle(s.openFeat, a.payload),
    abrirFeat: (s, a: PayloadAction<string>) => void (s.openFeat[a.payload] = true),
    toggleScen: (s, a: PayloadAction<string>) => toggle(s.openScen, a.payload),
    setLastAmb: (s, a: PayloadAction<string>) => void (s.lastAmb = a.payload),
  },
})

export const {
  setSis,
  setBusca,
  setFTipo,
  setFAss,
  setModGroup,
  setFRep,
  setFRod,
  setPainelF,
  setCasoTab,
  setCasoMod,
  setQType,
  toggleAberta,
  abrir,
  toggleRecolhido,
  setRecolhidos,
  toggleSelecao,
  selecionar,
  limparSelecao,
  toggleFeat,
  abrirFeat,
  toggleScen,
  setLastAmb,
} = uiSlice.actions
export default uiSlice.reducer
