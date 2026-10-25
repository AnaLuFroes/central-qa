import { useState } from 'react'
import { toast } from 'sonner'
import { Campo, Modal, StatusModal } from '@/components/Modal'
import { inputCls } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { criarRodada } from '@/data/rodadas'
import { useIr } from '@/hooks/useIr'
import { useSessao, useSistema } from '@/hooks/useSessao'
import { plural } from '@/lib/format'
import { buildItens, countScen } from '@/lib/gherkin'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selFeatures, selModulos } from '@/store/slices/selectors'
import { setLastAmb } from '@/store/slices/ui'
import type { Feature } from '@/types'

export default function RodadaDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const { orgId } = useSessao()
  const sistema = useSistema()
  const feats = useAppSelector(selFeatures)
  const mods = useAppSelector(selModulos)
  const lastAmb = useAppSelector((s) => s.ui.lastAmb)
  const fs = feats.filter((f) => f.tipo !== 'ca')
  const order = mods.map((m) => m.nome)

  const [nome, setNome] = useState(() => 'Rodada de ' + new Date().toLocaleDateString('pt-BR'))
  const [amb, setAmb] = useState(lastAmb)
  const [sel, setSel] = useState<Record<string, boolean>>(() => Object.fromEntries(fs.map((f) => [f.id, true])))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const gm = new Map<string, Feature[]>()
  for (const f of fs) {
    if (!gm.has(f.modulo)) gm.set(f.modulo, [])
    gm.get(f.modulo)!.push(f)
  }
  const grupos = [...gm.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
  const nSc = fs.filter((f) => sel[f.id]).reduce((a, f) => a + countScen(f.gherkin), 0)
  const allOn = fs.length > 0 && fs.every((f) => sel[f.id])

  const criar = async () => {
    if (salvando || !sistema) return
    const n = nome.trim()
    const a = amb.trim()
    if (!n) return setErro('Dê um nome à rodada.')
    if (!a) return setErro('Informe a branch ou o commit que está sendo testado.')
    const ids = fs
      .filter((f) => sel[f.id])
      .sort((x, y) => order.indexOf(x.modulo) - order.indexOf(y.modulo))
      .map((f) => f.id)
    if (!ids.length) return setErro('Selecione ao menos uma funcionalidade.')
    setSalvando(true)
    try {
      const id = await criarRodada(orgId, sistema.id, n, a, buildItens(ids, fs))
      dispatch(setLastAmb(a))
      toast('Rodada criada')
      ir.rodada(id)
    } catch (e) {
      setErro('Não foi possível salvar. ' + ((e as Error)?.message ?? ''))
      setSalvando(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      largura={640}
      titulo="Nova rodada de teste"
      descricao="Escolha as funcionalidades que entram nesta rodada. Cada cenário vira um item para marcar como Passou, Falhou ou Bloqueado."
      rodape={
        <>
          <StatusModal erro={!!erro}>{erro || plural(nSc, 'cenário selecionado', 'cenários selecionados')}</StatusModal>
          <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primario" size="modal" onClick={criar} disabled={salvando}>
            Criar rodada
          </Button>
        </>
      }
    >
      <Campo label="Nome" className="mb-3.5">
        <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Sprint 42 – Login" />
      </Campo>
      <Campo label="Ambiente testado" dica="Vai junto em cada ocorrência registrada nesta rodada." className="mb-3.5">
        <input
          className={cn(inputCls, 'font-mono text-[.88rem]')}
          value={amb}
          onChange={(e) => setAmb(e.target.value)}
          placeholder="Branch ou commit do PR, ex.: feature/login-ajustes · 3f9a2c1"
        />
      </Campo>
      <div className="mb-1.5 flex items-center justify-between gap-2.5">
        <span className="text-[.86rem] font-semibold">Funcionalidades</span>
        <button
          type="button"
          onClick={() => {
            setErro('')
            setSel(allOn ? {} : Object.fromEntries(fs.map((f) => [f.id, true])))
          }}
          className="py-0.5 text-[.85rem] font-semibold text-q-accent"
        >
          {allOn ? 'Limpar seleção' : 'Selecionar todas'}
        </button>
      </div>
      {!fs.length && (
        <p className="m-0 mb-3 text-[.92rem] text-q-muted">
          Este sistema ainda não tem casos de teste. Gere os casos a partir dos critérios aprovados.
        </p>
      )}
      <div className="flex max-h-[340px] flex-col gap-3 overflow-y-auto rounded-[10px] border border-q-line p-3">
        {grupos.map(([mod, arr]) => (
          <div key={mod} className="flex flex-col gap-1">
            <p className="m-0 mb-0.5 font-mono text-[.74rem] tracking-[.06em] text-q-muted">{mod}</p>
            {arr.map((f) => {
              const on = !!sel[f.id]
              return (
                <button
                  key={f.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => {
                    setErro('')
                    setSel((x) => ({ ...x, [f.id]: !x[f.id] }))
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-q-bg"
                >
                  <span
                    className={cn(
                      'grid size-5 flex-none place-items-center rounded-[5px] border-2',
                      on ? 'border-[#5B45C8] bg-[#5B45C8]' : 'border-[#C9C7E6] bg-q-card',
                    )}
                  >
                    {on && (
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 8.5l3.2 3L13 4.5" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{f.nome}</span>
                  <span className="text-[.82rem] whitespace-nowrap text-q-muted">{plural(countScen(f.gherkin), 'cenário', 'cenários')}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </Modal>
  )
}
