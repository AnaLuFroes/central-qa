// Peças das telas escuras de entrada (entrar, cadastro, aguardando, sistemas, plataforma).
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Avatar, Logo } from '@/components/qa'
import { cn } from '@/lib/utils'

/** Fundo azul-marinho com a grade, conteúdo numa coluna centralizada. */
export function TelaCentro({
  children,
  largura = 400,
  topo = false,
  label,
  canto,
  className,
}: {
  children: ReactNode
  largura?: number
  topo?: boolean
  label?: string
  /** Botões do canto superior direito (ver `CantoConta`). */
  canto?: ReactNode
  className?: string
}) {
  return (
    <section
      data-screen-label={label}
      className={cn(
        'relative flex min-h-screen flex-col items-center overflow-hidden bg-auth px-4 text-white sm:px-5',
        topo ? 'justify-start pt-[72px] pb-16' : 'justify-center py-16',
        canto && 'max-sm:justify-start max-sm:pt-0',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 auth-grid" aria-hidden />
      {canto}
      <div className="relative flex w-full flex-col items-center text-center" style={{ maxWidth: largura }}>
        {children}
      </div>
    </section>
  )
}

/** Logo, linha de cima, título em gradiente e texto de apoio. */
export function CabecalhoEntrada({
  eyebrow,
  titulo,
  sub,
  grande = false,
}: {
  eyebrow?: ReactNode
  titulo: ReactNode
  sub?: ReactNode
  grande?: boolean
}) {
  return (
    <>
      <Logo size={64} className="mb-4 shadow-[0_18px_40px_rgba(5,7,25,.55),0_0_0_1px_rgba(255,255,255,.08)]" />
      {eyebrow && <p className="m-0 mb-3.5 font-mono text-[.8rem] tracking-[.14em] text-cyan">{eyebrow}</p>}
      <h1
        className={cn(
          'm-0 w-fit max-w-full font-serif font-bold text-brand',
          grande
            ? 'mb-3.5 text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.12]'
            : 'mb-2 text-[clamp(1.9rem,4vw,2.5rem)] leading-[1.15]',
        )}
      >
        {titulo}
      </h1>
      {sub && (
        <p className={cn('m-0 text-pretty text-hero-text', grande ? 'text-[1.1rem] leading-[1.6]' : 'mb-7 text-base')}>
          {sub}
        </p>
      )}
    </>
  )
}

/** Botão principal em gradiente das telas escuras. */
export const botaoBrandCls =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-transparent bg-brand px-[18px] py-2.5 text-[.98rem] font-semibold text-navy-deep transition hover:brightness-105 hover:saturate-110 disabled:cursor-default disabled:opacity-50'
/** Botão secundário translúcido das telas escuras. */
export const botaoVidroCls =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-white/16 bg-white/4 px-4 py-[9px] text-[.92rem] font-medium text-hero-text transition hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-50'
/** Link em ciano. */
export const linkCianoCls = 'cursor-pointer border-0 bg-transparent p-0 font-semibold text-cyan hover:underline'

/** Canto superior direito: "Minha conta" (opcional) e "Sair". */
export function CantoConta({
  nome,
  foto,
  texto,
  conta = true,
  extra,
  onSair,
}: {
  nome: string
  foto?: string
  texto: string
  conta?: boolean
  extra?: ReactNode
  onSair: () => void
}) {
  const nav = useNavigate()
  return (
    <div className="relative z-[2] mb-8 flex w-full flex-wrap items-center justify-end gap-2.5 pt-4 text-[.9rem] text-hero-text sm:absolute sm:top-5 sm:right-6 sm:mb-0 sm:w-auto sm:p-0">
      {extra}
      {conta && (
        <button
          onClick={() => nav('/conta')}
          title="Minha conta"
          className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-full border border-white/14 bg-white/4 py-1 pr-3.5 pl-1 text-[.9rem] text-[#E3E4F7] transition-colors hover:border-cyan hover:bg-white/10"
        >
          <Avatar nome={nome} foto={foto} cor="#8FF0F2" size={30} />
          <span className="max-w-[220px] truncate">{texto}</span>
        </button>
      )}
      <button
        onClick={onSair}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/16 bg-white/4 px-3 py-[5px] text-[.85rem] font-medium text-hero-text transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-3.5" aria-hidden />
        Sair
      </button>
    </div>
  )
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 0 0 0 9.6L5.8 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.2L5.8 10c.9-2.6 3.3-4.6 6.2-4.6z" />
    </svg>
  )
}
