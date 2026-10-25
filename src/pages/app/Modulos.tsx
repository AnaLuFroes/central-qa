import { AppHeader, Main } from '@/components/AppHeader'
import { ModuleCover } from '@/components/ModuleCover'
import { SegBar } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { useIr } from '@/hooks/useIr'
import { useSistema } from '@/hooks/useSessao'
import { ASSUNTOS, assuntoOf } from '@/lib/assuntos'
import { hojeEyebrow, modOf, plural } from '@/lib/format'
import { modSegs, type ComStatus } from '@/lib/painel'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selComStatus, selModulos } from '@/store/slices/selectors'
import { setBusca, setFAss } from '@/store/slices/ui'
import type { Modulo } from '@/types'

const SUB = 'Cada módulo agrupa as ocorrências de uma tela ou área. Dentro dele, os itens já aparecem separados por assunto.'

export default function Modulos() {
  const dispatch = useAppDispatch()
  const sistema = useSistema()
  const mods = useAppSelector(selModulos)
  const all = useAppSelector(selComStatus)
  const busca = useAppSelector((s) => s.ui.busca)
  const q = busca.trim().toLowerCase()
  const shown = mods.filter((m) => !q || m.nome.toLowerCase().includes(q))
  const erros = all.filter((x) => x.f.tipo === 'erro').length
  const stats: [number, string, string][] = [
    [all.length, 'ocorrências', 'text-q-accent'],
    [erros, 'erros', 'text-q-red'],
    [all.length - erros, 'melhorias', 'text-q-accent'],
    [all.filter((x) => !x.f.loteId).length, 'ainda não enviadas', 'text-q-ok'],
  ]
  const novoMod = () => dispatch(abrirModal({ kind: 'mod' }))

  return (
    <>
      <AppHeader eyebrow={'MÓDULOS · ' + hojeEyebrow()} titulo={sistema?.nome ?? ''} sub={SUB} />
      <Main>
        <div className="relative -mt-[60px] flex flex-wrap gap-10 rounded-2xl border border-q-line bg-q-card px-7 py-[26px] shadow-card">
          {stats.map(([n, l, c]) => (
            <div key={l}>
              <div className={'font-serif text-[2.2rem] leading-none font-bold ' + c}>{n}</div>
              <div className="mt-2 text-[1.05rem] text-q-muted">{l}</div>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-2.5 border-b border-q-line pb-5">
          <label className="flex max-w-[440px] flex-[1_1_260px] items-center gap-2.5 rounded-full border border-q-line bg-q-card px-5 py-[9px] text-q-muted">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={busca}
              onChange={(e) => dispatch(setBusca(e.target.value))}
              placeholder="Buscar módulo"
              aria-label="Buscar módulo"
              className="w-full border-0 bg-transparent text-[1.05rem] text-q-ink outline-none"
            />
          </label>
          <span className="flex-1" />
          <Button variant="linha" size="acao" className="text-base font-medium" onClick={novoMod}>
            Novo módulo
          </Button>
          <Button variant="primario" size="acao" className="text-base" onClick={() => dispatch(abrirModal({ kind: 'fix' }))}>
            Nova ocorrência
          </Button>
        </div>

        {!mods.length && (
          <p className="m-0 pt-10 text-center text-q-muted">
            Nenhum módulo ainda.
            <br />
            Crie um módulo para cada tela ou área do sistema e cadastre as ocorrências dentro dele.
          </p>
        )}

        <div className="mt-[30px] grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[22px]">
          {shown.map((m) => (
            <CartaoModulo key={m.nome} m={m} fs={all.filter((x) => modOf(x.f) === m.nome)} />
          ))}
          <button
            type="button"
            onClick={novoMod}
            className="flex min-h-[280px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-q-line bg-transparent text-[1.1rem] font-medium text-q-muted transition-colors hover:border-q-accent hover:text-q-accent"
          >
            <span className="text-[1.4rem] leading-none">+</span>Novo módulo
          </button>
        </div>
        {mods.length > 0 && !shown.length && <p className="m-0 mt-4 text-q-muted">Nenhum módulo com “{busca}”.</p>}
      </Main>
    </>
  )
}

function Etiqueta({ cls, children }: { cls: string; children: string }) {
  return <span className={'rounded-full px-[11px] py-0.5 text-[.88rem] font-semibold ' + cls}>{children}</span>
}

function CartaoModulo({ m, fs }: { m: Modulo; fs: ComStatus[] }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const total = fs.length
  const erros = fs.filter((x) => x.f.tipo === 'erro').length
  const melh = total - erros
  const pend = fs.filter((x) => !x.f.loteId).length
  const cnt: Record<string, number> = {}
  for (const x of fs) {
    const a = assuntoOf(x.f)
    cnt[a] = (cnt[a] || 0) + 1
  }
  const topicos = ASSUNTOS.filter((a) => cnt[a.key])
    .map((a) => ({ a, n: cnt[a.key] }))
    .sort((x, y) => y.n - x.n)
    .slice(0, 3)
  const abrir = () => {
    dispatch(setFAss('all'))
    ir.modulo(m.nome)
  }
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-q-line bg-q-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[3px] hover:border-q-accent hover:shadow-card">
      <button type="button" onClick={abrir} className="flex size-full flex-col bg-transparent p-0 text-left text-inherit">
        <ModuleCover nome={m.nome} emoji={m.emoji} cor={m.cor} className="h-28" />
        <span className="flex flex-col gap-1 px-5 pt-4 pb-5">
          <span className="text-[1.2rem] leading-[1.3] font-semibold">{m.nome}</span>
          <span className="text-base text-q-muted">{total ? plural(total, 'ocorrência', 'ocorrências') : 'Sem ocorrências'}</span>
          {total > 0 && <SegBar segs={modSegs(fs)} className="mt-1.5 gap-0.5" />}
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {topicos.map(({ a, n }) => (
              <span
                key={a.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-q-line px-[9px] py-px text-[.78rem] text-q-muted"
              >
                <span className="size-2 rounded-full" style={{ background: a.cor }} />
                {a.nome} · {n}
              </span>
            ))}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {erros > 0 && <Etiqueta cls="bg-q-red-bg text-q-red">{plural(erros, 'erro', 'erros')}</Etiqueta>}
            {melh > 0 && <Etiqueta cls="bg-q-soft text-q-accent">{plural(melh, 'melhoria', 'melhorias')}</Etiqueta>}
            {pend > 0 && <Etiqueta cls="bg-q-warn-bg text-q-warn">{pend + ' a enviar'}</Etiqueta>}
            {total > 0 && !pend && <Etiqueta cls="bg-q-ok-bg text-q-ok">Tudo enviado</Etiqueta>}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => dispatch(abrirModal({ kind: 'mod', moduloId: m.id || undefined, nome: m.nome }))}
        aria-label="Editar módulo"
        className="absolute top-2 right-2 z-3 grid size-8 place-items-center rounded-[9px] border-0 bg-[rgba(14,16,39,.55)] text-white backdrop-blur-[4px]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>
    </article>
  )
}
