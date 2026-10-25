import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { botaoBrandCls, botaoVidroCls, CabecalhoEntrada, TelaCentro } from '@/components/Entrada'
import { EditorSistemas, type ItemEditor } from '@/components/EditorSistemas'
import { salvarSistemas } from '@/data/sistemas'
import { useExecutar, useSessao } from '@/hooks/useSessao'
import { useAppSelector } from '@/store/hooks'
import type { Sistema } from '@/types'

/** Administração dos sistemas da empresa (só Admin). */
export default function SistemasGerenciar() {
  const { org } = useAuth()
  const pronto = useAppSelector((s) => s.data.carregado.sistemas)
  const atuais = useAppSelector((s) => s.data.sistemas)
  const emp = org?.nome ?? ''
  return (
    <TelaCentro label="Sistemas da empresa" largura={820} topo>
      <CabecalhoEntrada eyebrow={`ADMINISTRAÇÃO · ${emp.toUpperCase()}`} titulo="Sistemas da empresa" />
      <div className="h-2" />
      {pronto ? <Gerenciar atuais={atuais} /> : <p className="m-0 text-hero-text">Carregando…</p>}
    </TelaCentro>
  )
}

function Gerenciar({ atuais }: { atuais: Sistema[] }) {
  const nav = useNavigate()
  const { orgId } = useSessao()
  const executar = useExecutar()
  const d = useAppSelector((s) => s.data)
  const [lista, setLista] = useState<ItemEditor[]>(() =>
    [...atuais]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((s) => ({ key: s.id, id: s.id, nome: s.nome, ini: s.ini, cor: s.cor })),
  )
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const temDados = (x: ItemEditor) =>
    !!x.id &&
    (d.modulos.some((m) => m.sis === x.id) ||
      d.ocorrencias.some((f) => f.sis === x.id) ||
      d.lotes.some((l) => l.sis === x.id) ||
      d.features.some((f) => f.sis === x.id))

  const salvar = async () => {
    if (!lista.length) return setErro('Cadastre pelo menos um sistema.')
    setSalvando(true)
    const ok = await executar(
      salvarSistemas(
        orgId,
        atuais,
        lista.map(({ id, nome, ini, cor }) => ({ id, nome, ini, cor })),
      ).then(() => true),
      'Sistemas salvos',
    )
    setSalvando(false)
    if (ok) nav('/sistemas')
  }

  return (
    <>
      <EditorSistemas
        lista={lista}
        onChange={(l) => {
          setLista(l)
          setErro('')
        }}
        ocupado={temDados}
        meta={(x) => (temDados(x) ? 'Com dados' : 'Sem dados')}
        erro={erro}
      />
      <div className="mt-10 flex flex-wrap justify-center gap-2.5">
        <button onClick={() => nav('/sistemas')} className={botaoVidroCls}>
          Cancelar
        </button>
        <button onClick={salvar} disabled={salvando} className={botaoBrandCls}>
          {salvando ? 'Salvando…' : 'Salvar sistemas'}
        </button>
      </div>
    </>
  )
}
