import { describe, expect, it } from 'vitest'
import { fila, flowBar, porModulo, rodStats, type ComStatus } from './painel'
import type { Feature, Ocorrencia, Rodada } from '@/types'

const f = (id: string, modulo: string, extra: Partial<Ocorrencia> = {}) => ({ id, modulo, regFeatId: null, ...extra }) as Ocorrencia
const all: ComStatus[] = [
  { f: f('1', 'A'), st: 'aberto' },
  { f: f('2', 'A'), st: 'retorno' },
  { f: f('3', 'B'), st: 'reteste' },
  { f: f('4', 'B'), st: 'validado' },
  { f: f('5', 'B', { regFeatId: 'ft' }), st: 'validado' },
]

describe('painel', () => {
  it('monta a fila na ordem resposta, reteste, reaberta, regressão', () => {
    const q = fila(all, [{ id: 'ft' } as Feature])
    expect(q.map((x) => x.kind + x.f.id)).toEqual(['resp2', 'ret3', 'reg4'])
  })
  it('ordena módulos por pendência', () => {
    const r = porModulo(all, ['A', 'B'])
    expect(r.map((x) => [x.nome, x.tot, x.pct])).toEqual([
      ['A', 2, 100],
      ['B', 1, 50],
    ])
  })
  it('soma 100% na barra', () => {
    expect(flowBar(all).reduce((a, s) => a + s.pct, 0)).toBeCloseTo(100)
  })
  it('conta a rodada', () => {
    const r = { itens: [{ key: 'c1' }, { key: 'c2' }, { key: 'c3' }], res: { c1: { st: 'passou' }, c2: { st: 'falhou' } } } as unknown as Rodada
    expect(rodStats(r)).toMatchObject({ t: 3, p: 1, f: 1, b: 0, pend: 1, pct: 67 })
  })
})
