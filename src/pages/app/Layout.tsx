import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { Carregando } from '@/components/Carregando'
import { Footer } from '@/components/Footer'
import { TopBar } from '@/components/TopBar'
import { ModalHost } from '@/modals/ModalHost'
import { useAtalhos } from '@/hooks/useAtalhos'
import { useSessao } from '@/hooks/useSessao'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSis } from '@/store/slices/ui'

/** Moldura das telas de um sistema: barra superior, conteúdo, rodapé e janelas. */
export default function Layout() {
  const { sis } = useParams()
  const { pathname } = useLocation()
  const dispatch = useAppDispatch()
  const s = useSessao()
  const sistemas = useAppSelector((x) => x.data.sistemas)
  const carregado = useAppSelector((x) => x.data.carregado.sistemas)
  const atual = useAppSelector((x) => x.ui.sis)
  useAtalhos(s.isQA)

  useEffect(() => {
    if (sis) dispatch(setSis(sis))
  }, [sis, dispatch])

  if (carregado && !sistemas.some((x) => x.id === sis)) return <Navigate to="/sistemas" replace />
  // O dev só vê a página do sistema e os lotes.
  if (s.isDev && !/\/dev$|\/lotes\/[^/]+$/.test(pathname)) return <Navigate to={`/s/${sis}/dev`} replace />
  if (!carregado || atual !== sis) return <Carregando />

  const naLote = /\/lotes\/[^/]+$/.test(pathname)
  return (
    <div className="flex min-h-screen flex-col bg-q-bg text-q-ink">
      <TopBar />
      <Suspense fallback={<Carregando />}>
        <Outlet />
      </Suspense>
      <Footer texto={s.isQA && !naLote ? 'Central de QA · pressione ? para ver os atalhos' : 'Central de QA'} />
      <ModalHost />
    </div>
  )
}
