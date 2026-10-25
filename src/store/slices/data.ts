import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ConfigIA, Feature, Lote, Membro, Modulo, Ocorrencia, Respostas, Rodada, Sistema } from '@/types'

/** Espelho em memória do Firestore da empresa, alimentado por onSnapshot. Não é persistido. */
export interface DataState {
  sistemas: Sistema[]
  modulos: Modulo[]
  ocorrencias: Ocorrencia[]
  lotes: Lote[]
  respostas: Respostas
  features: Feature[]
  rodadas: Rodada[]
  membros: Membro[]
  ia: ConfigIA | null
  carregado: { sistemas: boolean; lotes: boolean; ocorrencias: boolean; rodadas: boolean }
}

const initialState: DataState = {
  sistemas: [],
  modulos: [],
  ocorrencias: [],
  lotes: [],
  respostas: {},
  features: [],
  rodadas: [],
  membros: [],
  ia: null,
  carregado: { sistemas: false, lotes: false, ocorrencias: false, rodadas: false },
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setSistemas: (s, a: PayloadAction<Sistema[]>) => {
      s.sistemas = a.payload
      s.carregado.sistemas = true
    },
    setModulos: (s, a: PayloadAction<Modulo[]>) => void (s.modulos = a.payload),
    setOcorrencias: (s, a: PayloadAction<Ocorrencia[]>) => {
      s.ocorrencias = a.payload
      s.carregado.ocorrencias = true
    },
    setLotes: (s, a: PayloadAction<Lote[]>) => {
      s.lotes = a.payload
      s.carregado.lotes = true
    },
    setRespostas: (s, a: PayloadAction<Respostas>) => void (s.respostas = a.payload),
    setFeatures: (s, a: PayloadAction<Feature[]>) => void (s.features = a.payload),
    setRodadas: (s, a: PayloadAction<Rodada[]>) => {
      s.rodadas = a.payload
      s.carregado.rodadas = true
    },
    setMembros: (s, a: PayloadAction<Membro[]>) => void (s.membros = a.payload),
    setIA: (s, a: PayloadAction<ConfigIA | null>) => void (s.ia = a.payload),
    limparDados: () => initialState,
  },
})

export const {
  setSistemas,
  setModulos,
  setOcorrencias,
  setLotes,
  setRespostas,
  setFeatures,
  setRodadas,
  setMembros,
  setIA,
  limparDados,
} = dataSlice.actions
export default dataSlice.reducer
