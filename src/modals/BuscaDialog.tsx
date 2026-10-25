import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog as D } from 'radix-ui'
import { Pill } from '@/components/qa'
import { useIr } from '@/hooks/useIr'
import { fmtData, modOf, nq, plural } from '@/lib/format'
import { countScen } from '@/lib/gherkin'
import { rodStats } from '@/lib/painel'
import { STATUS, type Cor3 } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selComStatus, selFeatures, selLotes, selModulos, selRodadas } from '@/store/slices/selectors'
import { setQType, type TipoBusca } from '@/store/slices/ui'

interface Resultado {
  k: string
  tipo: string
  titulo: string
  sub: string
  tag?: Cor3
  go: () => void
}

const CHIPS: [TipoBusca, string][] = [
  ['all', 'Tudo'],
  ['fix', 'Ocorrências'],
  ['feat', 'Casos de teste'],
  ['rod', 'Rodadas'],
  ['lote', 'Lotes'],
  ['mod', 'Módulos'],
]

function Tecla({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[5px] border border-b-2 border-q-line bg-q-card px-1.5 py-px font-mono text-[.75rem] text-q-muted">{children}</span>
  )
}

function useResultados(q: string, tipo: TipoBusca): Resultado[] {
  const ir = useIr()
  const fixes = useAppSelector(selComStatus)
  const feats = useAppSelector(selFeatures)
  const rodadas = useAppSelector(selRodadas)
  const lotes = useAppSelector(selLotes)
  const mods = useAppSelector(selModulos)
  const term = nq(q.trim())
  if (!term) return []
  const ok = (k: TipoBusca) => tipo === 'all' || tipo === k
  const has = (...xs: unknown[]) => nq(xs.join(' ')).includes(term)
  const res: Resultado[] = []
  if (ok('fix'))
    for (const { f, st } of fixes)
      if (has(f.titulo, f.onde, f.modulo, f.atual, f.descricao, f.passos.join(' ')))
        res.push({
          k: 'f' + f.id,
          tipo: 'OCORRÊNCIA',
          titulo: f.titulo,
          sub: modOf(f) + (f.tipo === 'erro' ? ' · erro' : ' · melhoria'),
          tag: STATUS[st],
          go: () => ir.fix(f),
        })
  if (ok('feat'))
    for (const f of feats)
      if (has(f.nome, f.modulo, f.gherkin))
        res.push({
          k: 't' + f.id,
          tipo: 'CASO DE TESTE',
          titulo: f.nome,
          sub: f.modulo + ' · ' + plural(countScen(f.gherkin), 'cenário', 'cenários'),
          go: () => ir.casos(f.tipo === 'ca' ? 'ca' : 'feats', f.modulo, f.id),
        })
  if (ok('rod'))
    for (const r of rodadas)
      if (has(r.nome, r.itens.map((i) => i.titulo).join(' ')))
        res.push({ k: 'r' + r.id, tipo: 'RODADA', titulo: r.nome, sub: rodStats(r).counts, go: () => ir.rodada(r.id) })
  if (ok('lote'))
    for (const l of lotes)
      if (has(l.titulo, l.eyebrow))
        res.push({ k: 'l' + l.id, tipo: 'LOTE', titulo: l.titulo, sub: fmtData(l.criadoEm), go: () => ir.lote(l.id) })
  if (ok('mod'))
    for (const m of mods)
      if (has(m.nome)) {
        const n = fixes.filter((x) => modOf(x.f) === m.nome).length
        res.push({ k: 'm' + m.nome, tipo: 'MÓDULO', titulo: m.nome, sub: plural(n, 'ocorrência', 'ocorrências'), go: () => ir.modulo(m.nome) })
      }
  return res.slice(0, 40)
}

export default function BuscaDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch()
  const tipo = useAppSelector((s) => s.ui.qType)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    dispatch(setQType('all'))
  }, [dispatch])
  const res = useResultados(q, tipo)
  const term = q.trim()

  return (
    <D.Root open onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 overflow-y-auto bg-[rgba(6,16,31,.55)] px-3.5 pt-[10vh] pb-6 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <D.Content
            aria-describedby={undefined}
            className="mx-auto w-full max-w-[680px] overflow-hidden rounded-[14px] border border-q-line bg-q-card text-q-ink shadow-card outline-none"
          >
            <D.Title className="sr-only">Buscar</D.Title>
            <label className="flex items-center gap-3 border-b border-q-line px-5 py-4 text-q-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                ref={ref}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && res[0]) {
                    e.preventDefault()
                    res[0].go()
                  }
                }}
                placeholder="Buscar ocorrências, casos de teste, rodadas, lotes e módulos"
                aria-label="Buscar"
                className="w-full bg-transparent text-[1.1rem] text-q-ink outline-none placeholder:text-q-muted/70"
              />
              <Tecla>Esc</Tecla>
            </label>
            <div className="flex flex-wrap gap-1.5 border-b border-q-line px-5 py-3">
              {CHIPS.map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => {
                    dispatch(setQType(k))
                    ref.current?.focus()
                  }}
                  aria-pressed={tipo === k}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[.84rem] font-medium transition-colors',
                    tipo === k ? 'border-q-chip bg-q-chip text-white' : 'border-q-line bg-q-card text-q-muted hover:border-q-accent hover:text-q-accent',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {!term && (
                <p className="m-0 px-3 py-[18px] text-[.92rem] text-q-muted">
                  Digite para buscar em ocorrências, casos de teste, rodadas, lotes e módulos deste sistema.
                </p>
              )}
              {!!term && !res.length && <p className="m-0 px-3 py-[18px] text-[.92rem] text-q-muted">Nada encontrado para “{term}”.</p>}
              {res.map((r) => (
                <button
                  key={r.k}
                  onClick={r.go}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-q-bg focus-visible:bg-q-bg focus-visible:outline-none"
                >
                  <span className="w-28 flex-none rounded-[5px] bg-q-soft px-1.5 py-[3px] text-center font-mono text-[.68rem] font-semibold text-q-accent">
                    {r.tipo}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-[1.35]">
                    <span className="font-semibold">{r.titulo}</span>
                    <span className="text-[.84rem] text-q-muted">{r.sub}</span>
                  </span>
                  {r.tag && <Pill cor={r.tag} className="flex-none text-[.76rem]" />}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-[18px] border-t border-q-line px-5 py-2.5 text-[.8rem] text-q-muted">
              <span>
                <Tecla>Enter</Tecla> abre o primeiro resultado
              </span>
              <span>
                <Tecla>Esc</Tecla> fecha
              </span>
            </div>
          </D.Content>
        </D.Overlay>
      </D.Portal>
    </D.Root>
  )
}
