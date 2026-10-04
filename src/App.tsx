import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { RequireRole } from '@/auth/RequireRole'
import { homeFor } from '@/auth/roles'
import { Carregando } from '@/components/Carregando'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { lazy, Suspense } from 'react'
import { SessionStore } from '@/store/SessionStore'

const DevHome = lazy(() => import('@/pages/DevHome'))
const Login = lazy(() => import('@/pages/Login'))
const Lote = lazy(() => import('@/pages/Lote'))
const Lotes = lazy(() => import('@/pages/Lotes'))
const Modulo = lazy(() => import('@/pages/Modulo'))
const Modulos = lazy(() => import('@/pages/Modulos'))
const Pendente = lazy(() => import('@/pages/Pendente'))
const Usuarios = lazy(() => import('@/pages/admin/Usuarios'))

function Rotas() {
  const { loading, user, role } = useAuth()
  if (loading) return <Carregando />
  return (
    <SessionStore>
      <Suspense fallback={<Carregando />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pendente" element={user ? <Pendente /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<RequireRole roles={['admin', 'qa']}><Modulos /></RequireRole>} />
        <Route path="/lotes" element={<RequireRole roles={['admin', 'qa']}><Lotes /></RequireRole>} />
        <Route path="/modulos/:id" element={<RequireRole roles={['admin', 'qa']}><Modulo /></RequireRole>} />
        <Route path="/dev" element={<RequireRole roles={['dev']}><DevHome /></RequireRole>} />
        <Route path="/lote/:id" element={<RequireRole roles={['admin', 'qa', 'dev']}><Lote /></RequireRole>} />
        <Route path="/admin/usuarios" element={<RequireRole roles={['admin']}><Usuarios /></RequireRole>} />
        <Route path="*" element={<Navigate to={user ? homeFor(role) : '/login'} replace />} />
      </Routes>
      </Suspense>
    </SessionStore>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Rotas />
          <Toaster position="bottom-center" />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
