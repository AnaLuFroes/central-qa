import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Lote, Modulo, Ocorrencia, Progresso, Usuario } from '@/types'

/** Espelho em memória do Firestore, alimentado por onSnapshot. Não é persistido. */
export interface DataState {
  modulos: Modulo[]
  ocorrencias: Ocorrencia[]
  lotes: Lote[]
  progresso: Progresso
  usuarios: Usuario[]
  carregado: { modulos: boolean; ocorrencias: boolean; lotes: boolean }
}

const initialState: DataState = {
  modulos: [],
  ocorrencias: [],
  lotes: [],
  progresso: {},
  usuarios: [],
  carregado: { modulos: false, ocorrencias: false, lotes: false },
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setModulos: (s, a: PayloadAction<Modulo[]>) => {
      s.modulos = a.payload
      s.carregado.modulos = true
    },
    setOcorrencias: (s, a: PayloadAction<Ocorrencia[]>) => {
      s.ocorrencias = a.payload
      s.carregado.ocorrencias = true
    },
    setLotes: (s, a: PayloadAction<Lote[]>) => {
      s.lotes = a.payload
      s.carregado.lotes = true
    },
    setProgresso: (s, a: PayloadAction<Progresso>) => void (s.progresso = a.payload),
    setUsuarios: (s, a: PayloadAction<Usuario[]>) => void (s.usuarios = a.payload),
  },
})

export const { setModulos, setOcorrencias, setLotes, setProgresso, setUsuarios } = dataSlice.actions
export default dataSlice.reducer
