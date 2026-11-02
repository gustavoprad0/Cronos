/** Matches a recurring schedule against local calendar days, shifting weekend dates. */
export function matchesSchedule(
  date: Date,
  schedule: { tipo: string; dia_execucao: number | null; regra_dia_util: string },
): boolean {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  for (let offset = -2; offset <= 2; offset++) {
    const original = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const weekday = original.getDay() || 7;
    const matches = schedule.tipo === 'diario' ||
      (schedule.tipo === 'semanal' && schedule.dia_execucao === weekday) ||
      (schedule.tipo === 'mensal' && schedule.dia_execucao === original.getDate());
    if (!matches) continue;
    const shifted = new Date(original);
    if (weekday >= 6 && schedule.regra_dia_util === 'adiantar') {
      shifted.setDate(shifted.getDate() - (weekday - 5));
    } else if (weekday >= 6 && schedule.regra_dia_util === 'postergar') {
      shifted.setDate(shifted.getDate() + (8 - weekday));
    }
    if (shifted.getTime() === today.getTime()) return true;
  }
  return false;
}
