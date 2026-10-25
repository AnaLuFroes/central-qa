import type { ReactNode } from 'react'
import { PrintThumb } from '@/components/PrintImg'
import { esperadoItens, fixVazio } from '@/lib/format'
import { REPRO } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { ContextoFix, CorpoFix } from '@/types'

/** Subtítulo das seções do corpo do fix. */
export function H4({ children, className }: { children: ReactNode; className?: string }) {
  return <h4 className={cn('mt-4 mb-1.5 text-[.88rem] font-semibold text-q-accent', className)}>{children}</h4>
}

/** Linhas de "Contexto do teste" (ambiente, reprodução, perfil e dados, cenário). */
function contextoLinhas(f: Pick<ContextoFix, 'amb' | 'repro' | 'massa' | 'cenario'>): [string, string][] {
  const c: [string, string][] = []
  if (f.amb) c.push(['Ambiente', f.amb])
  if (f.repro) c.push(['Reprodução', REPRO[f.repro] ?? f.repro])
  if (f.massa) c.push(['Perfil e dados', f.massa])
  if (f.cenario) c.push(['Cenário', (f.cenario.ca ? f.cenario.ca + ' · ' : '') + f.cenario.feat + ' › ' + f.cenario.titulo])
  return c
}

/**
 * Corpo de um fix no "padrão de correção": onde, passos, situação atual, erro, ajuste esperado,
 * observação, contexto do teste e evidências.
 */
export function FixBody({ f, vazioTxt }: { f: CorpoFix & Pick<ContextoFix, 'amb' | 'repro' | 'massa' | 'cenario'>; vazioTxt?: string }) {
  const esp = esperadoItens(f.esperado)
  const ctx = contextoLinhas(f)
  return (
    <>
      {vazioTxt && fixVazio(f) && <p className="m-0 text-[.92rem] text-q-muted">{vazioTxt}</p>}
      {f.onde && (
        <p className="m-0 mb-1 text-[.92rem] text-q-muted">
          <b className="font-semibold">Onde ocorre:</b> {f.onde}
        </p>
      )}
      {f.passos.length > 0 && (
        <>
          <H4>Como reproduzir</H4>
          <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
            {f.passos.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-px grid size-[22px] flex-none place-items-center rounded-full bg-q-soft font-mono text-[.76rem] font-semibold text-q-accent">
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {f.atual && (
        <>
          <H4>Situação atual</H4>
          <p className="m-0 max-w-[70ch]">{f.atual}</p>
        </>
      )}
      {f.erro && (
        <div className="mt-2.5 rounded-md border-l-[3px] border-[#B42336] bg-q-track px-3 py-2.5 font-mono text-[.82rem] break-words whitespace-pre-wrap text-q-red">
          {f.erro}
        </div>
      )}
      {esp.length > 0 && (
        <>
          <H4>Ajuste esperado</H4>
          <div className="flex flex-col gap-1">
            {esp.map((e, i) =>
              e.quote ? (
                <p key={i} className="my-0.5 ml-1 border-l-[3px] border-[#5B45C8] py-0.5 pl-3 font-semibold">
                  {e.t}
                </p>
              ) : (
                <div key={i} className="flex max-w-[70ch] gap-2.5">
                  <span className="text-q-accent">•</span>
                  <span>{e.t}</span>
                </div>
              ),
            )}
          </div>
        </>
      )}
      {f.obs && (
        <p className="mt-3.5 mb-0 max-w-[70ch] rounded-lg bg-q-soft px-3 py-2.5 text-[.94rem]">
          <b className="text-q-accent">Observação:</b> {f.obs}
        </p>
      )}
      {ctx.length > 0 && (
        <>
          <H4>Contexto do teste</H4>
          <div className="flex max-w-[72ch] flex-col gap-[3px] text-[.92rem]">
            {ctx.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <span className="w-[118px] flex-none text-q-muted">{k}</span>
                <span className="min-w-0">{v}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {f.prints.length > 0 && (
        <>
          <H4>Evidências</H4>
          <div className="flex flex-wrap gap-2.5">
            {f.prints.map((p, i) => (
              <PrintThumb key={p.id} p={p} alt={'Evidência ' + (i + 1)} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
