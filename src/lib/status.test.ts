import { describe, expect, it } from 'vitest'
import { acoesFix, itemKey, loteStats, rotuloItem, stOf } from './status'
import type { Lote, Resposta, Respostas } from '@/types'

const resp = (st: Resposta['st'], thread = 0): Resposta => ({
  id: 'l1__fix-01',
  loteId: 'l1',
  key: 'fix-01',
  sis: 's',
  st,
  pr: '',
  com: '',
  em: 1,
  thread: Array.from({ length: thread }, () => ({ by: 'qa' as const, st: null, pr: '', txt: 'x', em: 1, nome: '' })),
})

const lote = {
  id: 'l1',
  secoes: [
    { nome: 'A', itens: [{ key: 'fix-01', ocorrenciaId: 'f1' }, { key: 'fix-02', ocorrenciaId: 'f2' }] },
    { nome: 'B', itens: [{ key: 'fix-03', ocorrenciaId: 'f3' }] },
  ],
} as unknown as Lote

describe('stOf', () => {
  it('segue o ciclo da ocorrência', () => {
    expect(stOf({ status: '', loteId: null }, null)).toBe('aberto')
    expect(stOf({ status: 'reaberto', loteId: null }, null)).toBe('reaberto')
    expect(stOf({ status: '', loteId: 'l1' }, null)).toBe('enviado')
    expect(stOf({ status: '', loteId: 'l1' }, resp(null, 1))).toBe('enviado')
    expect(stOf({ status: '', loteId: 'l1' }, resp('corrigido'))).toBe('reteste')
    expect(stOf({ status: '', loteId: 'l1' }, resp('adiado'))).toBe('adiada')
    expect(stOf({ status: '', loteId: 'l1' }, resp('info'))).toBe('retorno')
    expect(stOf({ status: 'validado', loteId: 'l1' }, resp('corrigido'))).toBe('validado')
    expect(stOf({ status: 'encerrado', loteId: 'l1' }, resp('esperado'))).toBe('encerrado')
  })
})

describe('acoesFix', () => {
  it('libera validar e reabrir no reteste', () => {
    expect(acoesFix('reteste', resp('corrigido'), false)).toMatchObject({ canVal: true, canReab: true, canReply: false })
  })
  it('só encerra quando o dev diz que é esperado ou adiado', () => {
    expect(acoesFix('retorno', resp('esperado'), false).canClose).toBe(true)
    expect(acoesFix('retorno', resp('info'), false).canClose).toBe(false)
  })
  it('regressão só para validada sem cenário', () => {
    expect(acoesFix('validado', null, false).canReg).toBe(true)
    expect(acoesFix('validado', null, true).canReg).toBe(false)
  })
})

describe('lote', () => {
  it('acha a chave do item', () => {
    expect(itemKey(lote, 'f3')).toBe('fix-03')
    expect(itemKey(lote, 'x')).toBeNull()
  })
  it('conta os itens respondidos', () => {
    const r: Respostas = { l1: { 'fix-01': resp('corrigido'), 'fix-02': resp(null, 1) } }
    expect(loteStats(lote, r)).toEqual({ total: 3, dn: 1, pend: 2, pct: 33 })
  })
  it('rotula o item', () => {
    expect(rotuloItem(null, false, false)[0]).toBe('Aguardando resposta')
    expect(rotuloItem(resp(null, 1), false, false)[0]).toBe('Nova resposta do QA')
    expect(rotuloItem(resp('naorep'), false, false)[0]).toBe('Não consegui reproduzir')
    expect(rotuloItem(resp('corrigido'), true, false)[0]).toBe('Reaberta pelo QA')
  })
})
