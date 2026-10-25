import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { RequireRole, RequireSuperAdmin, useHome } from '@/auth/RequireRole'
import { Carregando } from '@/components/Carregando'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionStore } from '@/store/SessionStore'
import { ThemeProvider, ThemeToggle } from '@/theme/ThemeProvider'

const Splash = lazy(() => import('@/pages/Splash'))
const Entrar = lazy(() => import('@/pages/Entrar'))
const Cadastro = lazy(() => import('@/pages/Cadastro'))
const Aguardando = lazy(() => import('@/pages/Aguardando'))
const Empresas = lazy(() => import('@/pages/plataforma/Empresas'))
const Sistemas = lazy(() => import('@/pages/Sistemas'))
const SistemasGerenciar = lazy(() => import('@/pages/SistemasGerenciar'))
const Conta = lazy(() => import('@/pages/Conta'))
const LoteRedirect = lazy(() => import('@/pages/LoteRedirect'))
const Layout = lazy(() => import('@/pages/app/Layout'))
const Painel = lazy(() => import('@/pages/app/Painel'))
const Modulos = lazy(() => import('@/pages/app/Modulos'))
const Modulo = lazy(() => import('@/pages/app/Modulo'))
const Casos = lazy(() => import('@/pages/app/Casos'))
const Rodada = lazy(() => import('@/pages/app/Rodada'))
const Lotes = lazy(() => import('@/pages/app/Lotes'))
const Lote = lazy(() => import('@/pages/app/Lote'))
const DevSistema = lazy(() => import('@/pages/app/DevSistema'))

const QA = ['QA', 'Admin'] as const
const TODOS = ['QA', 'Admin', 'Dev'] as const

function Rotas() {
  const { loading, user } = useAuth()
  const home = useHome()
  if (loading) return <Carregando />
  return (
    <SessionStore>
      <Suspense fallback={<Carregando />}>
        <Routes>
          <Route path="/" element={user ? <Navigate to={home} replace /> : <Splash />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/aguardando" element={user ? <Aguardando /> : <Navigate to="/entrar" replace />} />
          <Route path="/plataforma/empresas" element={<RequireSuperAdmin><Empresas /></RequireSuperAdmin>} />
          <Route path="/sistemas" element={<RequireRole perfis={[...TODOS]}><Sistemas /></RequireRole>} />
          <Route path="/sistemas/gerenciar" element={<RequireRole perfis={['Admin']}><SistemasGerenciar /></RequireRole>} />
          <Route path="/conta" element={<RequireRole perfis={[...TODOS]}><Conta /></RequireRole>} />
          <Route path="/lote/:id" element={<RequireRole perfis={[...TODOS]}><LoteRedirect /></RequireRole>} />
          <Route path="/s/:sis" element={<RequireRole perfis={[...TODOS]}><Layout /></RequireRole>}>
            <Route index element={<Navigate to="painel" replace />} />
            <Route path="painel" element={<RequireRole perfis={[...QA]}><Painel /></RequireRole>} />
            <Route path="modulos" element={<RequireRole perfis={[...QA]}><Modulos /></RequireRole>} />
            <Route path="modulos/:nome" element={<RequireRole perfis={[...QA]}><Modulo /></RequireRole>} />
            <Route path="casos" element={<RequireRole perfis={[...QA]}><Casos /></RequireRole>} />
            <Route path="rodadas/:id" element={<RequireRole perfis={[...QA]}><Rodada /></RequireRole>} />
            <Route path="lotes" element={<RequireRole perfis={[...QA]}><Lotes /></RequireRole>} />
            <Route path="lotes/:id" element={<Lote />} />
            <Route path="dev" element={<RequireRole perfis={['Dev']}><DevSistema /></RequireRole>} />
          </Route>
          <Route path="*" element={<Navigate to={user ? home : '/'} replace />} />
        </Routes>
      </Suspense>
    </SessionStore>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Rotas />
            <ThemeToggle />
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
