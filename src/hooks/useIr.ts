import { useNavigate } from 'react-router-dom'
import { modOf } from '@/lib/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrir, abrirFeat, setCasoMod, setCasoTab, setFTipo, type AbaCasos } from '@/store/slices/ui'
import { fecharModal } from '@/store/slices/modal'

export const rotaModulo = (sis: string, nome: string) => `/s/${sis}/modulos/${encodeURIComponent(nome)}`

/** Navegação entre as telas do sistema aberto. */
export function useIr() {
  const nav = useNavigate()
  const dispatch = useAppDispatch()
  const sis = useAppSelector((s) => s.ui.sis) ?? ''
  const ir = (p: string) => {
    dispatch(fecharModal())
    nav(p)
    window.scrollTo(0, 0)
  }
  return {
    sistemas: () => ir('/sistemas'),
    painel: () => ir(`/s/${sis}/painel`),
    modulos: () => ir(`/s/${sis}/modulos`),
    casos: (aba?: AbaCasos, mod?: string, featId?: string) => {
      if (aba) dispatch(setCasoTab(aba))
      if (mod) dispatch(setCasoMod(mod))
      if (featId) dispatch(abrirFeat(featId))
      ir(`/s/${sis}/casos`)
    },
    lotes: () => ir(`/s/${sis}/lotes`),
    lote: (id: string) => ir(`/s/${sis}/lotes/${id}`),
    rodada: (id: string) => ir(`/s/${sis}/rodadas/${id}`),
    dev: () => ir(`/s/${sis}/dev`),
    modulo: (nome: string) => {
      dispatch(setFTipo('all'))
      ir(rotaModulo(sis, nome))
    },
    /** Abre a ocorrência expandida na página do módulo. */
    fix: (f: { id: string; modulo: string }) => {
      dispatch(setFTipo('all'))
      dispatch(abrir(f.id))
      ir(rotaModulo(sis, modOf(f)))
    },
  }
}
