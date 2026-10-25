import { useState, useSyncExternalStore, type ChangeEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { useHome } from '@/auth/RequireRole'
import { CartaoEscuro, Erro, inputEscuroCls, labelEscuroCls } from '@/components/qa'
import { botaoBrandCls, botaoVidroCls, CabecalhoEntrada, TelaCentro } from '@/components/Entrada'
import { erroAuth } from '@/lib/erroAuth'
import { EditorSistemas, type ItemEditor } from '@/components/EditorSistemas'
import { criarEmpresa } from '@/data/orgs'
import { userRef } from '@/data/usuarios'
import { emailValido } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Cad {
  empresa: string
  nome: string
  email: string
  senha: string
}

// Ao criar o login, o app recarrega a sessão e esta página é montada de novo:
// o rascunho e o "criando" ficam fora do componente para não se perderem.
let guardado: { cad: Cad; lista: ItemEditor[] } | null = null
let criando = false
const ouvintes = new Set<() => void>()
const setCriando = (v: boolean) => {
  criando = v
  ouvintes.forEach((f) => f())
}
const useCriando = () =>
  useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb)
      return () => ouvintes.delete(cb)
    },
    () => criando,
  )

/** Espera o perfil users/{uid} ser gravado no primeiro acesso (até 8 s) antes de ligar a empresa a ele. */
const esperarUsuario = (uid: string) =>
  new Promise<void>((ok) => {
    let fim = () => {}
    const t = setTimeout(() => fim(), 8000)
    const un = onSnapshot(
      userRef(uid),
      (s) => {
        if (s.exists() && !s.metadata.hasPendingWrites) fim()
      },
      () => fim(),
    )
    fim = () => {
      clearTimeout(t)
      un()
      ok()
    }
  })

/** Criar conta da empresa: passo 1 (administrador) e passo 2 (sistemas). */
export default function Cadastro() {
  const { user, usuario, criarConta } = useAuth()
  const home = useHome()
  const nav = useNavigate()
  const emAndamento = useCriando()
  const [passo, setPasso] = useState<1 | 2>(guardado ? 2 : 1)
  const [cad, setCad] = useState<Cad>(() => guardado?.cad ?? { empresa: '', nome: '', email: '', senha: '' })
  const [lista, setLista] = useState<ItemEditor[]>(() => guardado?.lista ?? [])
  const [erro, setErro] = useState('')
  const [erro2, setErro2] = useState('')

  if (emAndamento)
    return (
      <TelaCentro label="Criar conta da empresa">
        <CabecalhoEntrada
          titulo="Criando a conta…"
          sub="Estamos cadastrando a empresa, o administrador e os sistemas."
        />
      </TelaCentro>
    )
  if (user && usuario?.orgId) return <Navigate to={home} replace />

  const logado = !!user
  const mudar = (k: keyof Cad) => (e: ChangeEvent<HTMLInputElement>) => {
    setCad((c) => ({ ...c, [k]: e.target.value }))
    setErro('')
  }

  const continuar = () => {
    const em = cad.email.trim().toLowerCase()
    if (!cad.empresa.trim() || (!logado && (!cad.nome.trim() || !em || !cad.senha)))
      return setErro('Preencha todos os campos.')
    if (!logado && !emailValido(em)) return setErro('Informe um e-mail válido.')
    if (!logado && cad.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    setPasso(2)
    window.scrollTo(0, 0)
  }

  const concluir = async () => {
    if (!lista.length) return setErro2('Cadastre pelo menos um sistema.')
    guardado = { cad, lista }
    setCriando(true)
    try {
      let u = user
      if (!u) {
        try {
          u = await criarConta(cad.nome.trim(), cad.email.trim().toLowerCase(), cad.senha)
        } catch (e) {
          guardado = null
          setErro(erroAuth(e, 'Não foi possível criar a conta.'))
          setPasso(1)
          return
        }
        await esperarUsuario(u.uid)
      }
      await criarEmpresa({
        empresa: cad.empresa,
        nome: logado ? u.displayName || u.email || '' : cad.nome,
        email: u.email || cad.email,
        uid: u.uid,
        sistemas: lista.map(({ nome, ini, cor }) => ({ nome, ini, cor })),
      })
      guardado = null
      toast('Conta da empresa criada')
      nav('/aguardando', { replace: true })
    } catch (e) {
      const msg = (e as Error)?.message || 'Não foi possível criar a conta da empresa.'
      setErro2(msg)
      toast.error(msg)
    } finally {
      setCriando(false)
    }
  }

  if (passo === 2) {
    const emp = cad.empresa.trim()
    return (
      <TelaCentro label="Sistemas da empresa" largura={820} topo>
        <CabecalhoEntrada eyebrow={`PASSO 2 DE 2 · ${emp.toUpperCase()}`} titulo={`Quais sistemas a ${emp} tem?`} />
        <div className="h-2" />
        <EditorSistemas
          lista={lista}
          onChange={(l) => {
            setLista(l)
            setErro2('')
          }}
          meta={(x) => 'Sigla ' + x.ini}
          erro={erro2}
        />
        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          <button onClick={() => setPasso(1)} className={botaoVidroCls}>
            Voltar
          </button>
          <button onClick={concluir} className={botaoBrandCls}>
            Concluir e entrar
          </button>
        </div>
      </TelaCentro>
    )
  }

  return (
    <TelaCentro label="Criar conta da empresa" largura={440}>
      <CabecalhoEntrada
        eyebrow="PASSO 1 DE 2 · ADMINISTRADOR"
        titulo="Criar conta da empresa"
        sub="Quem cria a conta é o administrador. No próximo passo você cadastra os sistemas que a sua empresa vai testar."
      />
      <CartaoEscuro className="w-full">
        <label htmlFor="cd-emp" className={labelEscuroCls}>
          Nome da empresa
        </label>
        <input
          id="cd-emp"
          value={cad.empresa}
          onChange={mudar('empresa')}
          placeholder="Ex.: Acme Tecnologia"
          className={inputEscuroCls}
        />
        {logado ? (
          <p className="m-0 mt-3.5 text-[.9rem] text-hero-text">
            Administrador: <b className="text-white">{user.displayName || user.email}</b>
            {user.displayName && <span className="block truncate text-[.84rem]">{user.email}</span>}
          </p>
        ) : (
          <>
            <label htmlFor="cd-nome" className={cn(labelEscuroCls, 'mt-3.5')}>
              Seu nome
            </label>
            <input
              id="cd-nome"
              autoComplete="name"
              value={cad.nome}
              onChange={mudar('nome')}
              placeholder="Ex.: Marina Souza"
              className={inputEscuroCls}
            />
            <label htmlFor="cd-email" className={cn(labelEscuroCls, 'mt-3.5')}>
              E-mail de trabalho
            </label>
            <input
              id="cd-email"
              type="email"
              autoComplete="email"
              value={cad.email}
              onChange={mudar('email')}
              placeholder="voce@empresa.com"
              className={inputEscuroCls}
            />
            <label htmlFor="cd-senha" className={cn(labelEscuroCls, 'mt-3.5')}>
              Senha
            </label>
            <input
              id="cd-senha"
              type="password"
              autoComplete="new-password"
              value={cad.senha}
              onChange={mudar('senha')}
              className={inputEscuroCls}
            />
          </>
        )}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[rgba(143,240,242,.22)] bg-[rgba(143,240,242,.08)] px-3.5 py-3">
          <ShieldCheck className="mt-0.5 size-[18px] flex-none text-cyan" strokeWidth={1.8} aria-hidden />
          <span className="text-[.88rem] leading-normal text-[#E3E4F7]">
            Você entra como <b className="text-white">Administrador</b>: cadastra e edita os sistemas da empresa e usa
            todas as áreas do QA.
          </span>
        </div>
        <Erro escuro>{erro}</Erro>
        <button onClick={continuar} className={cn(botaoBrandCls, 'mt-[18px] w-full')}>
          Continuar
        </button>
      </CartaoEscuro>
      <button
        onClick={() => nav(logado ? '/aguardando' : '/entrar')}
        className="mt-[18px] cursor-pointer border-0 bg-transparent p-0 text-[.92rem] text-hero-text hover:text-white"
      >
        {logado ? 'Voltar' : 'Já tenho conta · Entrar'}
      </button>
    </TelaCentro>
  )
}
