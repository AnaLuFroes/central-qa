// Editor da lista de sistemas da empresa (cadastro da empresa e "Gerenciar sistemas").
import { useState, type KeyboardEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { CartaoEscuro, Erro, inputEscuroCls, labelEscuroCls } from '@/components/qa'
import { botaoBrandCls, botaoVidroCls } from '@/components/Entrada'
import type { RascunhoSistema } from '@/data/sistemas'
import { useArmar } from '@/hooks/useArmar'
import { autoIni, coverBg, nq, PALS, plural, swatchBg } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Sistema na lista em edição; `key` identifica também os que ainda não foram gravados. */
export interface ItemEditor extends RascunhoSistema {
  key: string
}

interface Form {
  nome: string
  ini: string
  cor: number
  editKey: string | null
}

const vazio = (cor: number): Form => ({ nome: '', ini: '', cor, editKey: null })
const novaKey = () => 'n-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const limparSigla = (s: string) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)

export function EditorSistemas({
  lista,
  onChange,
  ocupado = () => false,
  meta,
  erro,
}: {
  lista: ItemEditor[]
  onChange: (l: ItemEditor[]) => void
  /** Sistema com módulos, ocorrências, lotes ou casos de teste: não pode ser removido. */
  ocupado?: (x: ItemEditor) => boolean
  meta: (x: ItemEditor) => string
  /** Erro vindo da página (ex.: "Cadastre pelo menos um sistema."). */
  erro?: string
}) {
  const [f, setF] = useState<Form>(() => vazio(lista.length % PALS.length))
  const [err, setErr] = useState('')
  const [delErr, setDelErr] = useState('')
  const { armado, armar } = useArmar()

  const set = (p: Partial<Form>) => {
    setF((x) => ({ ...x, ...p }))
    setErr('')
  }

  const salvar = () => {
    const nome = f.nome.trim()
    const ini = limparSigla(f.ini.trim() || autoIni(nome))
    if (!nome) return setErr('Dê um nome ao sistema.')
    if (!ini) return setErr('Informe uma sigla.')
    const outros = lista.filter((y) => y.key !== f.editKey)
    if (outros.some((y) => nq(y.nome) === nq(nome))) return setErr('Já existe um sistema com esse nome.')
    if (outros.some((y) => y.ini === ini)) return setErr('Essa sigla já está em uso.')
    const next = f.editKey
      ? lista.map((y) => (y.key === f.editKey ? { ...y, nome, ini, cor: f.cor } : y))
      : [...lista, { key: novaKey(), id: null, nome, ini, cor: f.cor }]
    onChange(next)
    setF(vazio(next.length % PALS.length))
    setErr('')
    setDelErr('')
  }

  const remover = (x: ItemEditor) => {
    if (ocupado(x)) {
      setDelErr(`“${x.nome}” já tem módulos, ocorrências ou casos de teste e não pode ser removido.`)
      return
    }
    setDelErr('')
    armar(x.key, () => {
      onChange(lista.filter((y) => y.key !== x.key))
      if (f.editKey === x.key) setF(vazio(f.cor))
    })
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      salvar()
    }
  }

  const sugestao = autoIni(f.nome) || 'SIS'
  const exCod = (f.ini.trim() || sugestao).toUpperCase() + '-001'
  const msg = err || erro

  return (
    <>
      <p className="m-0 mb-7 max-w-[56ch] text-base text-pretty text-hero-text">
        Cadastre cada sistema que o time de QA vai testar. Cada um tem seus próprios módulos, ocorrências, lotes e casos
        de teste. A sigla vira o prefixo dos códigos (ex.: <span className="font-mono text-cyan">{exCod}</span>).
      </p>

      <CartaoEscuro className="grid w-full grid-cols-[minmax(0,1fr)_96px] gap-3.5 sm:grid-cols-[minmax(0,1fr)_120px]">
        <div>
          <label htmlFor="sa-nome" className={labelEscuroCls}>
            Nome do sistema
          </label>
          <input
            id="sa-nome"
            value={f.nome}
            onChange={(e) => set({ nome: e.target.value })}
            onKeyDown={onKey}
            placeholder="Ex.: Portal do Cliente"
            className={inputEscuroCls}
          />
        </div>
        <div>
          <label htmlFor="sa-ini" className={labelEscuroCls}>
            Sigla
          </label>
          <input
            id="sa-ini"
            value={f.ini}
            maxLength={4}
            onChange={(e) => set({ ini: e.target.value.toUpperCase() })}
            onKeyDown={onKey}
            placeholder={sugestao}
            className={cn(inputEscuroCls, 'font-mono uppercase')}
          />
        </div>
        <div className="col-span-full">
          <span className={labelEscuroCls}>Cor da capa</span>
          <div className="flex flex-wrap gap-2">
            {PALS.map((p, i) => {
              const on = f.cor === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => set({ cor: i })}
                  aria-label={`Cor ${i + 1}`}
                  aria-pressed={on}
                  className={cn(
                    'h-8 w-[46px] cursor-pointer rounded-[9px] border-2 transition-transform hover:-translate-y-0.5',
                    on ? 'border-cyan shadow-[0_0_0_3px_rgba(143,240,242,.25)]' : 'border-transparent',
                  )}
                  style={{ background: swatchBg(p) }}
                />
              )
            })}
          </div>
        </div>
        <div className="col-span-full flex flex-wrap items-center gap-2.5">
          {msg && (
            <p role="alert" className="m-0 text-[.88rem] text-pink">
              {msg}
            </p>
          )}
          <span className="flex-1" />
          {f.editKey && (
            <button type="button" onClick={() => setF(vazio(f.cor))} className={botaoVidroCls}>
              Cancelar edição
            </button>
          )}
          <button type="button" onClick={salvar} className={botaoBrandCls}>
            {f.editKey ? 'Salvar alteração' : 'Adicionar sistema'}
          </button>
        </div>
      </CartaoEscuro>

      <div className="mt-9 mb-[18px] flex w-full items-baseline justify-between gap-3 border-b border-white/14 pb-2.5">
        <h2 className="m-0 font-serif text-[1.25rem] text-white">Sistemas cadastrados</h2>
        <span className="font-mono text-[.8rem] text-hero-text">{plural(lista.length, 'sistema', 'sistemas')}</span>
      </div>
      {!lista.length && (
        <p className="m-0 mt-2 text-[.95rem] text-hero-text">Nenhum sistema ainda. Cadastre o primeiro acima.</p>
      )}
      <div className="flex w-full flex-wrap justify-center gap-[22px]">
        {lista.map((x) => {
          const arm = armado(x.key)
          const delTip = arm ? 'Clique de novo para remover' : 'Remover'
          return (
            <div key={x.key} className="relative w-[150px] sm:w-[170px]">
              <div
                className={cn(
                  'flex w-full flex-col overflow-hidden rounded-[18px] border bg-navy-card text-left shadow-[0_18px_36px_rgba(5,7,25,.45)]',
                  f.editKey === x.key ? 'border-cyan' : 'border-white/14',
                )}
              >
                <span
                  className="relative grid h-[110px] w-full place-items-center overflow-hidden"
                  style={{ background: coverBg(PALS[x.cor % PALS.length]) }}
                >
                  <span className="absolute inset-0 cover-grid" aria-hidden />
                  <span className="relative font-serif text-[1.9rem] font-bold text-white [text-shadow:0_4px_16px_rgba(8,10,30,.4)]">
                    {x.ini}
                  </span>
                </span>
                <span className="flex flex-col gap-0.5 px-3.5 pt-3 pb-3.5">
                  <span className="text-base leading-[1.3] font-semibold break-words text-white">{x.nome}</span>
                  <span className="text-[.82rem] text-hero-text">{meta(x)}</span>
                </span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setF({ nome: x.nome, ini: x.ini, cor: x.cor, editKey: x.key })
                    setErr('')
                    setDelErr('')
                  }}
                  title="Editar"
                  aria-label={`Editar ${x.nome}`}
                  className="grid size-[30px] cursor-pointer place-items-center rounded-lg bg-[rgba(14,16,39,.6)] text-white backdrop-blur-[4px] hover:bg-[rgba(14,16,39,.85)]"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remover(x)}
                  title={delTip}
                  aria-label={delTip}
                  className={cn(
                    'grid size-[30px] cursor-pointer place-items-center rounded-lg text-white backdrop-blur-[4px] hover:bg-[rgba(180,35,54,.85)]',
                    arm ? 'bg-[rgba(180,35,54,.85)]' : 'bg-[rgba(14,16,39,.6)]',
                  )}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {delErr && (
        <div className="mt-4">
          <Erro escuro>{delErr}</Erro>
        </div>
      )}
    </>
  )
}
