import { useNavigate } from 'react-router-dom'
import { Carregando } from '@/components/Carregando'
import { Footer } from '@/components/Footer'
import { Hero, HeroLead, HeroTitle, Main } from '@/components/Hero'
import { LoteCard } from '@/components/LoteCard'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selLoteStats } from '@/store/slices/selectors'
import { setFRep } from '@/store/slices/ui'

export default function DevHome() {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const lotes = useAppSelector((s) => s.data.lotes)
  const carregado = useAppSelector((s) => s.data.carregado.lotes)
  const stats = useAppSelector(selLoteStats)

  return (
    <div className="flex min-h-screen flex-col">
      <Hero className="pt-11 pb-[72px]">
        <HeroTitle size="md">Correções para o desenvolvimento</HeroTitle>
        <HeroLead>Lotes de ajustes enviados pelo QA. Abra um lote para ver cada fix e marcar o que já foi concluído.</HeroLead>
      </Hero>
      <Main className="relative -mt-[30px] flex flex-col gap-3">
        {!carregado ? (
          <Carregando />
        ) : (
          !lotes.length && (
            <div className="rounded-[14px] border bg-card px-5 py-[18px]">Nenhum lote disponível no momento.</div>
          )
        )}
        {lotes.map((l) => (
          <LoteCard
            key={l.id}
            lote={l}
            stats={stats[l.id]}
            className="shadow-card"
            acoes={
              <Button
                variant="gradient"
                className="h-auto px-4 py-1.5 text-[.9rem]"
                onClick={() => {
                  dispatch(setFRep('all'))
                  nav(`/lote/${l.id}`)
                }}
              >
                Abrir
              </Button>
            }
          />
        ))}
      </Main>
      <Footer />
    </div>
  )
}
