import { modOf } from '@/lib/format'
import { blocoRegressao, featureRegressao, marcarRegressao, nomeRegressao } from '@/lib/gherkin'
import type { Feature, Ocorrencia } from '@/types'
import { criarFeature, salvarGherkin } from './features'
import { ligarRegressao } from './ocorrencias'

/**
 * Transforma a ocorrência validada em cenário de regressão: marca o cenário de origem (se ela veio
 * de uma rodada) ou acrescenta um cenário na funcionalidade "Regressão — <módulo>". Devolve o aviso.
 */
export async function criarRegressao(orgId: string, f: Ocorrencia, feats: Feature[], sysN: string): Promise<string> {
  const ft = f.cenario ? feats.find((x) => x.id === f.cenario!.featId) : undefined
  if (ft && f.cenario) {
    const novo = marcarRegressao(ft.gherkin, f.cenario.titulo, f.cod || f.id)
    if (novo) {
      await salvarGherkin(orgId, ft.id, novo, ft.nome)
      await ligarRegressao(orgId, f.id, ft.id)
      return 'Cenário de origem marcado com @regressao'
    }
  }
  const mod = modOf(f)
  const bloco = blocoRegressao(f, mod)
  const nome = nomeRegressao(mod)
  const ex = feats.find((x) => x.sis === f.sis && x.modulo === mod && x.nome === nome)
  let id: string
  if (ex) {
    await salvarGherkin(orgId, ex.id, ex.gherkin.replace(/\s*$/, '') + '\n\n' + bloco, ex.nome)
    id = ex.id
  } else {
    id = await criarFeature(orgId, {
      tipo: 'casos',
      sis: f.sis,
      modulo: mod,
      nome,
      lang: 'pt',
      gherkin: featureRegressao(sysN, mod, bloco),
      caSt: 'rascunho',
      caCod: '',
      caId: null,
      camada: 'e2e',
    })
  }
  await ligarRegressao(orgId, f.id, id)
  return 'Cenário de regressão criado em Casos de teste'
}
