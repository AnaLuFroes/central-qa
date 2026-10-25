// "Organizar": transforma a descrição livre no padrão de correção.
// Usa a IA configurada pela empresa; sem IA (ou se ela falhar), aplica o modelo básico do protótipo.
import { completar, iaConfigurada } from '@/lib/ia'
import { buildPromptOrganizar, parseJsonLoose, type SaidaOrganizarIA } from '@/lib/ia/prompts'
import type { ConfigIA, Prioridade, Repro, Tipo } from '@/types'

export interface EntradaOrganizar {
  sistema: string
  titulo: string
  descricao: string
  modulo: string
  tipo: Tipo
  prioridade: Prioridade
  amb: string
  massa: string
  repro: Repro | ''
  nPrints: number
  onde: string
  passosT: string
  atual: string
  espT: string
}

export interface SaidaOrganizar {
  titulo: string
  tipo: Tipo
  prioridade: Prioridade
  onde: string
  passosT: string
  atual: string
  espT: string
  status: string
}

function modeloBasico(v: EntradaOrganizar): SaidaOrganizar {
  const tela = v.modulo.trim() || 'Tela informada'
  const desc = v.descricao.trim()
  return {
    titulo: v.titulo,
    tipo: v.tipo,
    prioridade: v.prioridade,
    onde: v.onde || `${tela}.`,
    passosT: v.passosT || [`Acesse ${tela}.`, 'Repita a ação descrita no registro.', 'Observe o resultado na tela.'].join('\n'),
    atual: v.atual || desc || v.titulo,
    espT:
      v.espT ||
      (v.tipo === 'erro'
        ? 'Corrigir o comportamento para que a ação seja concluída sem erro.'
        : 'Aplicar o ajuste descrito, mantendo o padrão visual da tela.'),
    status: 'Organizado sem IA, com um modelo básico. Revise os passos antes de salvar.',
  }
}

export async function organizar(v: EntradaOrganizar, ia: ConfigIA | null): Promise<SaidaOrganizar> {
  if (iaConfigurada(ia)) {
    try {
      const o = parseJsonLoose<SaidaOrganizarIA>(await completar(ia, buildPromptOrganizar(v), 4000))
      if (o) {
        const fal = (o.faltando || []).filter(Boolean)
        return {
          titulo: o.titulo || v.titulo,
          onde: o.onde || v.onde,
          passosT: (o.passos || []).join('\n') || v.passosT,
          atual: o.atual || v.atual,
          espT: (o.esperado || []).join('\n') || v.espT,
          tipo: o.tipo === 'melhoria' ? 'melhoria' : o.tipo === 'erro' ? 'erro' : v.tipo,
          prioridade: o.prioridade === 'alta' || o.prioridade === 'normal' || o.prioridade === 'baixa' ? o.prioridade : v.prioridade,
          status: fal.length ? 'Organizado. Antes de salvar, responda: ' + fal.join(' ') : 'Pronto. Revise os campos e salve.',
        }
      }
    } catch (e) {
      console.warn('[ia] organizar falhou, usando o modelo básico', e)
    }
  } else await new Promise((r) => setTimeout(r, 900))
  return modeloBasico(v)
}
