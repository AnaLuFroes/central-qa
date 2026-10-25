import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Campo, Modal, StatusModal } from '@/components/Modal'
import { ModuleCover } from '@/components/ModuleCover'
import { inputCls } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { criarModulo, excluirModulo, salvarModulo, type DadosModulo } from '@/data/modulos'
import { rotaModulo, useIr } from '@/hooks/useIr'
import { useExecutar, useSessao } from '@/hooks/useSessao'
import { EMOJIS, PALS, modOf, palIndex, plural, swatchBg } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import type { Modal as TModal } from '@/store/slices/modal'
import { selModulos, selOcorrencias } from '@/store/slices/selectors'

export default function ModuloDialog({ m, onClose }: { m: Extract<TModal, { kind: 'mod' }>; onClose: () => void }) {
  const { orgId } = useSessao()
  const exec = useExecutar()
  const ir = useIr()
  const { pathname } = useLocation()
  const sis = useAppSelector((s) => s.ui.sis) ?? ''
  const mods = useAppSelector(selModulos)
  const todosMods = useAppSelector((s) => s.data.modulos)
  const ocorrencias = useAppSelector((s) => s.data.ocorrencias)
  const features = useAppSelector((s) => s.data.features)
  const fixesSis = useAppSelector(selOcorrencias)
  const orig = (m.moduloId && todosMods.find((x) => x.id === m.moduloId)) || (m.nome != null ? mods.find((x) => x.nome === m.nome) : undefined)
  const [nome, setNome] = useState(orig?.nome ?? '')
  const [emoji, setEmoji] = useState(orig?.emoji ?? '')
  const [cor, setCor] = useState<number | null>(orig?.cor ?? null)
  const [status, setStatus] = useState('')
  const [salvando, setSalvando] = useState(false)

  const nm = nome.trim() || 'Novo módulo'
  const ci = palIndex({ nome: nm, cor })
  const naPagina = !!orig && pathname === rotaModulo(sis, orig.nome)

  const salvar = async () => {
    const n = nome.trim()
    if (!n) return setStatus('Dê um nome ao módulo.')
    if (mods.some((x) => x.nome.toLowerCase() === n.toLowerCase() && x.nome !== orig?.nome))
      return setStatus('Já existe um módulo com esse nome.')
    const dados: DadosModulo = { nome: n, emoji, cor }
    setSalvando(true)
    const ok = await exec(
      (async () => {
        if (orig?.id) await salvarModulo(orgId, orig, dados, ocorrencias, features)
        else if (orig) {
          // Módulo que só existia pelo nome nas ocorrências: cadastra e renomeia junto, se for o caso.
          const id = await criarModulo(orgId, sis, { nome: orig.nome, emoji, cor })
          await salvarModulo(orgId, { ...orig, id }, dados, ocorrencias, features)
        } else await criarModulo(orgId, sis, dados)
        return true
      })(),
      'Módulo salvo',
    )
    setSalvando(false)
    if (!ok) return
    onClose()
    if (naPagina && orig?.nome !== n) ir.modulo(n)
  }

  const excluir = async () => {
    if (!orig) return
    const total = fixesSis.filter((f) => modOf(f) === orig.nome).length
    if (total) return setStatus('Mova ou exclua as ' + plural(total, 'ocorrência', 'ocorrências') + ' deste módulo antes de excluí-lo.')
    if (orig.id && !(await exec(excluirModulo(orgId, orig.id).then(() => true), 'Módulo excluído'))) return
    onClose()
    ir.modulos()
  }

  return (
    <Modal
      onClose={onClose}
      titulo={orig ? 'Editar módulo' : 'Novo módulo'}
      descricao="Cada módulo agrupa as ocorrências de uma tela ou área do sistema."
      rodape={
        <>
          <StatusModal erro>{status}</StatusModal>
          {orig && (
            <Button variant="perigo" size="modal" className="font-medium" onClick={() => void excluir()}>
              Excluir módulo
            </Button>
          )}
          <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primario" size="modal" disabled={salvando} onClick={() => void salvar()}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="group relative mb-4">
        <ModuleCover nome={nm} emoji={emoji} cor={cor} grande className="h-[130px] rounded-xl" />
        <span className="absolute bottom-2.5 left-3.5 text-base font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,.5)]">{nm}</span>
      </div>
      <Campo label="Nome">
        <input
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setStatus('')
          }}
          placeholder="Ex.: Telas de Login"
          className={inputCls}
          autoFocus
        />
      </Campo>
      <Campo label="Ícone" className="gap-1.5">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ícone">
          {EMOJIS.map((e) => (
            <button
              key={e || 'nenhum'}
              type="button"
              role="radio"
              aria-checked={emoji === e}
              onClick={() => setEmoji(e)}
              className={cn(
                'grid size-[38px] place-items-center rounded-[10px] border bg-q-bg font-serif text-[1.15rem] text-q-muted',
                emoji === e ? 'border-q-accent ring-3 ring-q-soft' : 'border-q-line',
              )}
            >
              {e || 'Aa'}
            </button>
          ))}
        </div>
      </Campo>
      <Campo label="Capa" className="gap-1.5">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Capa">
          {PALS.map((p, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === ci}
              aria-label={'Cor ' + (i + 1)}
              onClick={() => setCor(i)}
              className={cn('h-[30px] w-[42px] rounded-lg border-2', i === ci ? 'border-q-accent ring-3 ring-q-soft' : 'border-transparent')}
              style={{ background: swatchBg(p) }}
            />
          ))}
        </div>
      </Campo>
    </Modal>
  )
}
