import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { CartaoEscuro, Erro, inputEscuroCls, labelEscuroCls } from '@/components/qa'
import { botaoBrandCls, botaoVidroCls } from '@/components/Entrada'
import { salvarConfigIA } from '@/data/iaConfig'
import { useSessao } from '@/hooks/useSessao'
import { erroIA, iaConfigurada, PROVEDORES, provedorNome, testarIA } from '@/lib/ia'
import { fmtDH } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import type { ConfigIA, ProvedorIA } from '@/types'

/** Chave salva mostrada só com o começo e o fim (sk-…abcd). */
const mascarar = (k: string) => (k.length > 8 ? `${k.slice(0, 3)}…${k.slice(-4)}` : '••••')

/** Configuração de IA da empresa: o Admin edita, o QA vê o status. */
export default function AbaIA() {
  const { isAdmin } = useSessao()
  const cfg = useAppSelector((s) => s.data.ia)
  const ok = iaConfigurada(cfg)

  return (
    <>
      <CartaoEscuro className="mt-6 flex flex-wrap items-start gap-3.5">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-[rgba(143,240,242,.1)] text-cyan">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-[1_1_240px]">
          <p className="m-0 text-[.96rem] leading-relaxed text-pretty text-hero-text">
            A Central de QA usa o provedor de IA da própria empresa: o navegador chama a API do provedor diretamente,
            com a chave cadastrada aqui. Sem configuração, as funções de IA usam o modelo básico, sem IA.
          </p>
          <p
            className={cn(
              'm-0 mt-3 inline-flex items-center gap-2 text-[.92rem] font-semibold',
              ok ? 'text-[#7BE0B8]' : 'text-gold',
            )}
          >
            {ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            {ok
              ? `Configurada · ${provedorNome(cfg.provedor)} · ${cfg.modelo}`
              : 'Não configurada — as funções de IA usam o modelo básico, sem IA'}
          </p>
          {ok && cfg.em && (
            <p className="m-0 mt-1 font-mono text-[.74rem] text-white/50">Atualizada em {fmtDH(cfg.em)}</p>
          )}
        </div>
      </CartaoEscuro>
      {isAdmin && <FormIA key={cfg?.em ?? 'nova'} cfg={cfg} />}
      <Aviso />
    </>
  )
}

function Aviso() {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[rgba(255,200,121,.35)] bg-[rgba(255,200,121,.08)] px-3.5 py-3">
      <AlertTriangle className="mt-0.5 size-[18px] flex-none text-gold" aria-hidden />
      <span className="text-[.88rem] leading-normal text-[#E3E4F7]">
        <b className="text-white">Atenção:</b> a chave fica guardada no banco de dados da empresa e é usada direto do
        navegador das pessoas com perfil QA ou Administrador. Use uma chave com limite de gastos e troque-a se alguém
        sair da equipe.
      </span>
    </div>
  )
}

function FormIA({ cfg }: { cfg: ConfigIA | null }) {
  const { orgId, uid } = useSessao()
  const [provedor, setProvedor] = useState<ProvedorIA>(cfg?.provedor ?? 'anthropic')
  const [modelo, setModelo] = useState(cfg?.modelo ?? PROVEDORES[0].modelo)
  const [chave, setChave] = useState('')
  const [ver, setVer] = useState(false)
  const [baseURL, setBaseURL] = useState(cfg?.baseURL ?? '')
  const [erro, setErro] = useState('')
  const [teste, setTeste] = useState<{ ok: boolean; txt: string } | null>(null)
  const [ocupado, setOcupado] = useState<'' | 'teste' | 'salvar'>('')

  const p = PROVEDORES.find((x) => x.id === provedor) ?? PROVEDORES[0]
  // A chave salva só vale para o mesmo provedor.
  const chaveSalva = cfg && cfg.provedor === provedor ? cfg.apiKey : ''
  const compat = provedor === 'compat'

  const limpar = () => {
    setErro('')
    setTeste(null)
  }

  const trocarProvedor = (id: ProvedorIA) => {
    setProvedor(id)
    setModelo(PROVEDORES.find((x) => x.id === id)?.modelo ?? '')
    setChave('')
    limpar()
  }

  const montar = (): ConfigIA | null => {
    const c: ConfigIA = {
      provedor,
      modelo: modelo.trim(),
      apiKey: chave.trim() || chaveSalva,
      baseURL: compat ? baseURL.trim() : '',
      atualizadoPor: uid,
      em: null,
    }
    const falta = !c.modelo
      ? 'Informe o modelo.'
      : compat && !c.baseURL
        ? 'Informe a URL base do serviço.'
        : !compat && !c.apiKey
          ? 'Informe a chave da API.'
          : ''
    if (falta) setErro(falta)
    return falta ? null : c
  }

  const testar = async () => {
    limpar()
    const c = montar()
    if (!c) return
    setOcupado('teste')
    try {
      const r = await testarIA(c)
      setTeste({ ok: true, txt: `Conexão funcionando. Resposta do modelo: “${r.trim().slice(0, 80)}”` })
    } catch (e) {
      setTeste({ ok: false, txt: erroIA(e) })
    } finally {
      setOcupado('')
    }
  }

  const salvar = async () => {
    limpar()
    const c = montar()
    if (!c) return
    setOcupado('salvar')
    try {
      await salvarConfigIA(orgId, { provedor: c.provedor, modelo: c.modelo, apiKey: c.apiKey, baseURL: c.baseURL }, uid)
      toast('Configuração de IA salva')
    } catch (e) {
      console.error(e)
      setErro('Não foi possível salvar. ' + ((e as Error)?.message ?? ''))
    } finally {
      setOcupado('')
    }
  }

  return (
    <CartaoEscuro className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="ia-prov" className={labelEscuroCls}>
          Provedor
        </label>
        <select
          id="ia-prov"
          value={provedor}
          onChange={(e) => trocarProvedor(e.target.value as ProvedorIA)}
          className={cn(inputEscuroCls, 'cursor-pointer [&>option]:bg-navy-card')}
        >
          {PROVEDORES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ia-modelo" className={labelEscuroCls}>
          Modelo
        </label>
        <input
          id="ia-modelo"
          list="ia-sugestoes"
          value={modelo}
          onChange={(e) => {
            setModelo(e.target.value)
            limpar()
          }}
          placeholder={p.sugestoes[0] ?? 'Nome do modelo'}
          className={cn(inputEscuroCls, 'font-mono text-[.92rem]')}
        />
        <datalist id="ia-sugestoes">
          {p.sugestoes.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ia-chave" className={labelEscuroCls}>
          Chave/token da API{compat && <span className="font-normal text-white/50"> (opcional)</span>}
        </label>
        <div className="relative">
          <input
            id="ia-chave"
            type={ver ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={chave}
            onChange={(e) => {
              setChave(e.target.value)
              limpar()
            }}
            placeholder={chaveSalva ? `${mascarar(chaveSalva)} (salva — digite para trocar)` : 'Cole a chave aqui'}
            className={cn(inputEscuroCls, 'pr-11 font-mono text-[.92rem]')}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            title={ver ? 'Ocultar chave' : 'Mostrar chave'}
            aria-label={ver ? 'Ocultar chave' : 'Mostrar chave'}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-hero-text hover:bg-white/10 hover:text-white"
          >
            {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {compat && (
        <div className="sm:col-span-2">
          <label htmlFor="ia-url" className={labelEscuroCls}>
            URL base
          </label>
          <input
            id="ia-url"
            type="url"
            value={baseURL}
            onChange={(e) => {
              setBaseURL(e.target.value)
              limpar()
            }}
            placeholder="https://openrouter.ai/api/v1"
            className={cn(inputEscuroCls, 'font-mono text-[.92rem]')}
          />
        </div>
      )}
      <p className="m-0 text-[.86rem] text-hero-text sm:col-span-2">{p.ajuda}</p>
      <div className="flex flex-wrap items-center gap-2.5 sm:col-span-2">
        <div className="min-w-0 flex-[1_1_200px]">
          {teste && (
            <p role="status" className={cn('m-0 text-[.88rem] break-words', teste.ok ? 'text-[#7BE0B8]' : 'text-pink')}>
              {teste.txt}
            </p>
          )}
          <Erro escuro>{erro}</Erro>
        </div>
        <button onClick={testar} disabled={!!ocupado} className={botaoVidroCls}>
          {ocupado === 'teste' ? 'Testando…' : 'Testar conexão'}
        </button>
        <button onClick={salvar} disabled={!!ocupado} className={botaoBrandCls}>
          {ocupado === 'salvar' ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </CartaoEscuro>
  )
}
