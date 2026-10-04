// "Organizar": transforma a descrição livre no padrão de correção.
// v1 reproduz a heurística local do protótipo; isolado aqui para ser trocado por uma Cloud Function com IA.
import type { Tipo } from '@/types'

export interface EntradaOrganizar {
  titulo: string
  descricao: string
  modulo: string
  tipo: Tipo
  onde: string
  passosT: string
  atual: string
  espT: string
}

export type SaidaOrganizar = Pick<EntradaOrganizar, 'onde' | 'passosT' | 'atual' | 'espT'>

export async function organizar(v: EntradaOrganizar): Promise<SaidaOrganizar> {
  await new Promise((r) => setTimeout(r, 900))
  const tela = v.modulo.trim() || 'Tela informada'
  const desc = v.descricao.trim()
  return {
    onde: v.onde || `${tela}.`,
    passosT:
      v.passosT || [`Acesse ${tela}.`, 'Repita a ação descrita no registro.', 'Observe o resultado na tela.'].join('\n'),
    atual: v.atual || desc || v.titulo,
    espT:
      v.espT ||
      (v.tipo === 'erro'
        ? 'Corrigir o comportamento para que a ação seja concluída sem erro.'
        : 'Aplicar o ajuste descrito, mantendo o padrão visual da tela.'),
  }
}
