import assert from 'node:assert/strict';
import { matchesSchedule } from '../apps/realtime/dist/schedule.js';

const date = (day) => new Date(2026, 10, day, 12);
const weekly = (rule) => ({ tipo: 'semanal', dia_execucao: 6, regra_dia_util: rule });
assert.equal(matchesSchedule(date(6), weekly('adiantar')), true);
assert.equal(matchesSchedule(date(7), weekly('adiantar')), false);
assert.equal(matchesSchedule(date(9), weekly('postergar')), true);
assert.equal(matchesSchedule(date(7), weekly('manter')), true);
assert.equal(matchesSchedule(date(6), { tipo: 'mensal', dia_execucao: 8, regra_dia_util: 'adiantar' }), true);
assert.equal(matchesSchedule(date(9), { tipo: 'mensal', dia_execucao: 8, regra_dia_util: 'postergar' }), true);
console.log('OK: regras de agendamento no fim de semana.');
