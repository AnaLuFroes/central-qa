import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Role } from '@/types'

export interface PerfilState {
  uid: string | null
  nome: string
  email: string
  foto: string
  role: Role | null
}

const initialState: PerfilState = { uid: null, nome: '', email: '', foto: '', role: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPerfil: (_s, a: PayloadAction<PerfilState>) => a.payload,
  },
})

export const { setPerfil } = authSlice.actions
export default authSlice.reducer
