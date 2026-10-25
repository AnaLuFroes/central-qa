import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, ChevronsUpDown, FlaskConical, Layers, LogOut, Search, Send } from 'lucide-react'
import { Avatar, Logo } from '@/components/qa'
import { PERFIL_COR, PERFIL_LABEL } from '@/auth/roles'
import { useSessao, useSistema } from '@/hooks/useSessao'
import { coverBg, PALS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSair } from '@/store/SessionStore'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selComStatus, selFeatures, selLotes, selOcorrencias } from '@/store/slices/selectors'
import { fila } from '@/lib/painel'

/** Aba ativa do dock pela rota. */
export function abaDaRota(path: string): number {
  if (/\/modulos/.test(path)) return 1
  if (/\/casos|\/rodadas/.test(path)) return 2
  if (/\/lotes/.test(path)) return 3
  return 0
}

/** Barra superior fixa: troca de sistema, dock com as 4 abas (QA), busca, conta e sair. */
export function TopBar() {
  const s = useSessao()
  const sis = useSistema()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const dispatch = useAppDispatch()
  const sair = useSair()
  const all = useAppSelector(selComStatus)
  const feats = useAppSelector(selFeatures)
  const fixes = useAppSelector(selOcorrencias)
  const lotes = useAppSelector(selLotes)
  const nFila = fila(all, feats).length
  const ni = abaDaRota(pathname)
  const base = `/s/${sis?.id ?? ''}`
  const dock = [
    { label: 'Visão geral', hint: 'Visão geral (1)', Icon: Activity, n: nFila, to: base + '/painel' },
    { label: 'Módulos', hint: 'Módulos (2)', Icon: Layers, n: fixes.filter((x) => !x.loteId).length, to: base + '/modulos' },
    { label: 'Casos', hint: 'Casos de teste (3)', Icon: FlaskConical, n: feats.length, to: base + '/casos' },
    { label: 'Lotes', hint: 'Lotes (4)', Icon: Send, n: lotes.length, to: base + '/lotes' },
  ]
  const ir = (to: string) => {
    nav(to)
    window.scrollTo(0, 0)
  }

  return (
    <div className="sticky top-0 z-30 h-16 border-b border-[rgba(180,200,248,.16)] bg-topbar text-white shadow-[0_8px_24px_rgba(17,20,48,.18)] backdrop-blur-[14px] backdrop-saturate-[1.4]">
      <div className="mx-auto flex h-full max-w-[1240px] items-center gap-2 px-3 sm:gap-3.5 sm:px-5">
        <button
          onClick={() => ir('/sistemas')}
          title="Trocar de sistema"
          className="flex flex-none items-center gap-1.5 rounded-xl py-[5px] pr-1.5 pl-[5px] transition-colors hover:bg-white/8 sm:gap-2.5 sm:pr-2.5"
        >
          <Logo size={30} className="hidden sm:block" />
          <span className="hidden h-6 w-px bg-white/18 sm:block" />
          <span
            className="grid size-[30px] place-items-center rounded-[9px] font-mono text-[.62rem] font-semibold [text-shadow:0_1px_6px_rgba(8,10,30,.5)]"
            style={{ background: sis?.capa ? `center/cover no-repeat url("${sis.capa}")` : coverBg(PALS[(sis?.cor ?? 0) % PALS.length]) }}
          >
            {sis?.capa ? '' : sis?.ini}
          </span>
          <span className="hidden flex-col text-left leading-[1.15] sm:flex">
            <span className="font-mono text-[.64rem] tracking-[.12em] text-hero-text">SISTEMA</span>
            <span className="text-[.98rem] font-semibold whitespace-nowrap">{sis?.nome}</span>
          </span>
          <ChevronsUpDown className="size-4" />
        </button>

        {s.isQA ? (
          <nav
            role="tablist"
            aria-label="Seções"
            className="relative mx-auto grid max-w-[680px] min-w-0 flex-[1_1_640px] grid-cols-4 rounded-full border border-white/10 bg-white/5 p-1"
          >
            <span
              aria-hidden
              className="ease-mola absolute top-1 bottom-1 rounded-full bg-brand shadow-[0_6px_22px_rgba(143,240,242,.32),inset_0_1px_0_rgba(255,255,255,.6)] transition-[left] duration-[550ms]"
              style={{ left: `calc(${ni * 25}% + ${4 - 2 * ni}px)`, width: 'calc(25% - 2px)' }}
            />
            {dock.map((t, i) => {
              const on = i === ni
              return (
                <button
                  key={t.label}
                  role="tab"
                  aria-selected={on}
                  title={t.hint}
                  onClick={() => ir(t.to)}
                  className={cn(
                    'relative z-[1] flex min-w-0 items-center justify-center gap-[7px] rounded-full px-1.5 py-2 text-[.88rem] font-semibold transition-colors duration-300',
                    on ? 'text-navy-deep' : 'text-hero-text',
                  )}
                >
                  <t.Icon className="size-[17px] flex-none" strokeWidth={1.8} />
                  <span className="hidden truncate md:inline">{t.label}</span>
                  {t.n > 0 && (
                    <span
                      className={cn(
                        'hidden min-w-5 flex-none rounded-full px-1.5 py-px text-center font-mono text-[.68rem] lg:inline',
                        on ? 'bg-[rgba(17,20,48,.14)]' : 'bg-white/10',
                      )}
                    >
                      {t.n}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        ) : (
          <div className="flex-1" />
        )}

        {s.isQA && (
          <button
            onClick={() => dispatch(abrirModal({ kind: 'busca' }))}
            title="Buscar (/)"
            aria-label="Buscar"
            className="grid size-[38px] flex-none place-items-center rounded-full border border-white/14 bg-white/6 text-[#E3E4F7] transition-colors hover:bg-white/14"
          >
            <Search className="size-[17px]" strokeWidth={1.8} />
          </button>
        )}
        <button
          onClick={() => ir('/conta')}
          title={`Minha conta · ${s.nome} · ${s.perfil ? PERFIL_LABEL[s.perfil] : ''}`}
          aria-label="Minha conta"
          className="flex-none rounded-full shadow-[0_0_0_2px_rgba(255,255,255,.18)] transition hover:scale-105 hover:shadow-[0_0_0_3px_#8FF0F2]"
        >
          <Avatar nome={s.nome} foto={s.foto} cor={s.perfil ? PERFIL_COR[s.perfil] : undefined} />
        </button>
        <button
          onClick={() => void sair()}
          title="Sair"
          aria-label="Sair"
          className="grid size-[34px] flex-none place-items-center rounded-full text-hero-text transition-colors hover:bg-white/8 hover:text-white"
        >
          <LogOut className="size-[17px]" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
