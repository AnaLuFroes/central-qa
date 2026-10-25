import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal, fecharModal } from '@/store/slices/modal'

/** Atalhos de teclado do QA: / ou Ctrl+K busca, N nova ocorrência, T casos, 1–4 abas, ? ajuda, Esc fecha. */
export function useAtalhos(ativo: boolean) {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { sis, nome } = useParams()
  const modal = useAppSelector((s) => s.modal)
  const casoTab = useAppSelector((s) => s.ui.casoTab)
  const casoMod = useAppSelector((s) => s.ui.casoMod)

  useEffect(() => {
    if (!ativo || !sis) return
    const h = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement | null
      const typing = !!tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)
      if (e.key === 'Escape') {
        if (modal) dispatch(fecharModal())
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (modal?.kind !== 'busca') dispatch(abrirModal({ kind: 'busca' }))
        return
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey || modal) return
      const k = e.key
      const naCasos = /\/casos/.test(pathname)
      const mod = nome ? decodeURIComponent(nome) : ''
      if (k === '/') {
        e.preventDefault()
        dispatch(abrirModal({ kind: 'busca' }))
      } else if (k === 'n' || k === 'N') dispatch(abrirModal({ kind: 'fix', modulo: mod }))
      else if (k === 't' || k === 'T')
        dispatch(abrirModal({ kind: 'caso', mode: naCasos && casoTab === 'ca' ? 'ca' : 'casos', modulo: naCasos ? casoMod ?? '' : mod }))
      else if (k === '?') dispatch(abrirModal({ kind: 'atalhos' }))
      else if (/^[1-4]$/.test(k)) {
        nav(`/s/${sis}/` + ['painel', 'modulos', 'casos', 'lotes'][+k - 1])
        window.scrollTo(0, 0)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [ativo, sis, nome, pathname, modal, casoTab, casoMod, dispatch, nav])
}
