import { lazy, Suspense } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fecharModal } from '@/store/slices/modal'

const OcorrenciaDialog = lazy(() => import('./OcorrenciaDialog'))
const ModuloDialog = lazy(() => import('./ModuloDialog'))
const GerarLoteDialog = lazy(() => import('./GerarLoteDialog'))
const LinkDialog = lazy(() => import('./LinkDialog'))
const ImgDialog = lazy(() => import('./ImgDialog'))
const CasoDialog = lazy(() => import('./CasoDialog'))
const RodadaDialog = lazy(() => import('./RodadaDialog'))
const BuscaDialog = lazy(() => import('./BuscaDialog'))
const AtalhosDialog = lazy(() => import('./AtalhosDialog'))

/** Abre a janela pedida em `state.modal` (uma por vez). */
export function ModalHost() {
  const m = useAppSelector((s) => s.modal)
  const dispatch = useAppDispatch()
  const onClose = () => dispatch(fecharModal())
  if (!m) return null
  return (
    <Suspense fallback={null}>
      {m.kind === 'fix' && <OcorrenciaDialog m={m} onClose={onClose} />}
      {m.kind === 'mod' && <ModuloDialog m={m} onClose={onClose} />}
      {m.kind === 'lote' && <GerarLoteDialog onClose={onClose} />}
      {m.kind === 'link' && <LinkDialog m={m} onClose={onClose} />}
      {m.kind === 'img' && <ImgDialog m={m} onClose={onClose} />}
      {m.kind === 'caso' && <CasoDialog m={m} onClose={onClose} />}
      {m.kind === 'rodada' && <RodadaDialog onClose={onClose} />}
      {m.kind === 'busca' && <BuscaDialog onClose={onClose} />}
      {m.kind === 'atalhos' && <AtalhosDialog onClose={onClose} />}
    </Suspense>
  )
}
