import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Carregando } from '@/components/Carregando'
import { useAppSelector } from '@/store/hooks'

/** Link compartilhado do lote (/lote/:id): abre o lote dentro do sistema dele. */
export default function LoteRedirect() {
  const { id } = useParams()
  const carregado = useAppSelector((s) => s.data.carregado.lotes)
  const lote = useAppSelector((s) => s.data.lotes.find((l) => l.id === id))
  const naoAchou = carregado && !lote

  useEffect(() => {
    if (naoAchou) toast('Lote não encontrado. Ele pode ter sido excluído.')
  }, [naoAchou])

  if (!carregado) return <Carregando />
  if (!lote) return <Navigate to="/sistemas" replace />
  return <Navigate to={`/s/${lote.sis}/lotes/${lote.id}`} replace />
}
