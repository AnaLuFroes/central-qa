import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Perfil } from '@/types'

/** Quem está logado e em qual empresa (espelho do AuthProvider). */
export interface PerfilState {
  uid: string | null
  nome: string
  email: string
  foto: string
  orgId: string | null
  perfil: Perfil | null
}

const initialState: PerfilState = { uid: null, nome: '', email: '', foto: '', orgId: null, perfil: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPerfil: (_s, a: PayloadAction<PerfilState>) => a.payload,
  },
})

export const { setPerfil } = authSlice.actions
export default authSlice.reducer
