import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { AppHero } from '@/components/AppHero'
import { Carregando } from '@/components/Carregando'
import { Footer } from '@/components/Footer'
import { Main } from '@/components/Hero'
import { ModuleCard } from '@/components/ModuleCard'
import { StatsCard } from '@/components/StatsCard'
import { Button } from '@/components/ui/button'
import { ModuloDialog } from '@/modals/ModuloDialog'
import { OcorrenciaDialog, type AlvoOcorrencia } from '@/modals/OcorrenciaDialog'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selModulosOrdenados, selStatsGerais, selStatsPorModulo } from '@/store/slices/selectors'
import { setBusca, setFTipo } from '@/store/slices/ui'
import type { Modulo } from '@/types'

export default function Modulos() {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const modulos = useAppSelector(selModulosOrdenados)
  const stats = useAppSelector(selStatsGerais)
  const porModulo = useAppSelector(selStatsPorModulo)
  const busca = useAppSelector((s) => s.ui.busca)
  const carregado = useAppSelector((s) => s.data.carregado.modulos)
  const [modDialog, setModDialog] = useState<{ modulo: Modulo | null } | null>(null)
  const [ocAlvo, setOcAlvo] = useState<AlvoOcorrencia | null>(null)

  const q = busca.trim().toLowerCase()
  const shown = modulos.filter((m) => !q || m.nome.toLowerCase().includes(q))

  return (
    <div className="flex min-h-screen flex-col">
      <AppHero />
      <Main>
        <StatsCard stats={stats} />

        <div className="mt-9 flex flex-wrap items-center gap-2.5 border-b pb-5">
          <label className="flex max-w-[440px] flex-[1_1_260px] items-center gap-2.5 rounded-full border bg-card px-5 py-[9px] text-muted-foreground">
            <Search className="size-[17px]" />
            <input
              value={busca}
              onChange={(e) => dispatch(setBusca(e.target.value))}
              placeholder="Buscar módulo"
              aria-label="Buscar módulo"
              className="w-full border-0 bg-transparent text-[1.05rem] text-foreground outline-none"
            />
          </label>
          <span className="flex-1" />
          <Button variant="outline" size="lg" className="px-[18px] text-base text-muted-foreground hover:border-primary hover:bg-card hover:text-primary" onClick={() => setModDialog({ modulo: null })}>
            Novo módulo
          </Button>
          <Button variant="gradient" size="lg" className="px-[18px] text-base" onClick={() => setOcAlvo({ modo: 'nova' })}>
            Nova ocorrência
          </Button>
        </div>

        {!carregado ? (
          <Carregando />
        ) : (
          <>
            {!modulos.length && (
              <p className="m-0 pt-10 text-center text-muted-foreground">
                Nenhum módulo ainda.
                <br />
                Crie um módulo para cada tela ou área do sistema e cadastre as ocorrências dentro dele.
              </p>
            )}
            <div className="mt-[30px] grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[22px]">
              {shown.map((m) => (
                <ModuleCard
                  key={m.id}
                  modulo={m}
                  stats={porModulo[m.id]}
                  onOpen={() => {
                    dispatch(setFTipo('all'))
                    nav(`/modulos/${m.id}`)
                  }}
                  onEdit={() => setModDialog({ modulo: m })}
                />
              ))}
              <button
                onClick={() => setModDialog({ modulo: null })}
                className="flex min-h-[280px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed bg-transparent text-[1.1rem] font-medium text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="size-5" />
                Novo módulo
              </button>
            </div>
            {modulos.length > 0 && !shown.length && (
              <p className="mt-4 mb-0 text-muted-foreground">Nenhum módulo com “{busca}”.</p>
            )}
          </>
        )}
      </Main>
      <Footer />

      <ModuloDialog open={!!modDialog} modulo={modDialog?.modulo ?? null} onClose={() => setModDialog(null)} />
      <OcorrenciaDialog alvo={ocAlvo} onClose={() => setOcAlvo(null)} />
    </div>
  )
}
