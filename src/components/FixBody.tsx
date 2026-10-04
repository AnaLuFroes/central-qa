import { PrintImg } from '@/components/PrintImg'
import { abrirPrint } from '@/data/prints'
import { esperadoItens } from '@/lib/format'
import type { CorpoFix } from '@/types'

const H4 = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mt-4 mb-1.5 text-[.88rem] font-semibold text-primary">{children}</h4>
)

/** Corpo de um fix no "padrão de correção": onde, passos, situação atual, erro, ajuste esperado, observação, prints. */
export function FixBody({ f }: { f: CorpoFix }) {
  const esp = esperadoItens(f.esperado)
  return (
    <>
      {f.onde && (
        <p className="m-0 mb-1 text-[.92rem] text-muted-foreground">
          <b className="font-semibold">Onde ocorre:</b> {f.onde}
        </p>
      )}
      {f.passos.length > 0 && (
        <>
          <H4>Como reproduzir</H4>
          <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
            {f.passos.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-px grid size-[22px] flex-none place-items-center rounded-full bg-accent font-mono text-[.76rem] font-semibold text-primary">
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
        <div className="mt-2.5 rounded-md border-l-[3px] border-erro bg-track px-3 py-2.5 font-mono text-[.82rem] break-words whitespace-pre-wrap text-erro">
          {f.erro}
        </div>
      )}
      {esp.length > 0 && (
        <>
          <H4>Ajuste esperado</H4>
          <div className="flex flex-col gap-1">
            {esp.map((e, i) =>
              e.quote ? (
                <p key={i} className="my-0.5 ml-1 border-l-[3px] border-primary py-0.5 pl-3 font-semibold">
                  {e.t}
                </p>
              ) : (
                <div key={i} className="flex max-w-[70ch] gap-2.5">
                  <span className="text-primary">•</span>
                  <span>{e.t}</span>
                </div>
              ),
            )}
          </div>
        </>
      )}
      {f.obs && (
        <p className="mt-3.5 mb-0 max-w-[70ch] rounded-lg bg-accent px-3 py-2.5 text-[.94rem]">
          <b className="text-primary">Observação:</b> {f.obs}
        </p>
      )}
      {f.prints.length > 0 && (
        <>
          <H4>Prints</H4>
          <div className="flex flex-wrap gap-2.5">
            {f.prints.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void abrirPrint(p.id)}
                aria-label={`Abrir ${p.nome}`}
                className="block h-28 overflow-hidden rounded-lg border bg-card transition hover:border-primary"
              >
                <PrintImg p={p} className="h-28 w-auto max-w-[220px] object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
