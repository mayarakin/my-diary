import type { Demanda, Recorrencia } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function daysBetween(startKey: string, endKey: string): number {
  const a = parseDateKey(startKey).getTime();
  const b = parseDateKey(endKey).getTime();
  return Math.round((b - a) / DAY_MS);
}

export function weekdayLabel(day: number): string {
  const labels = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  return labels[day] ?? "—";
}

/** True se a demanda deve aparecer na data (YYYY-MM-DD). */
export function isDemandaDueOn(demanda: Demanda, dateKey: string): boolean {
  const rec = demanda.recorrencia;
  if (!rec) {
    if (demanda.prazo === dateKey) return true;
    // Sem prazo e sem recorrência: só na home geral, não força no "Hoje"
    return false;
  }

  const start = rec.dataInicio;
  if (dateKey < start) return false;

  const target = parseDateKey(dateKey);
  const weekday = target.getDay();

  if (rec.tipo === "semanal") {
    const wanted = rec.diaSemana ?? weekday;
    return weekday === wanted;
  }

  if (rec.tipo === "quinzenal") {
    const wanted = rec.diaSemana ?? parseDateKey(start).getDay();
    if (weekday !== wanted) return false;
    const diff = daysBetween(start, dateKey);
    return diff % 14 === 0;
  }

  if (rec.tipo === "a_cada_n_dias") {
    const n = Math.max(1, rec.intervaloDias ?? 15);
    if (rec.diaSemana !== undefined && weekday !== rec.diaSemana) {
      return false;
    }
    const diff = daysBetween(start, dateKey);
    return diff % n === 0;
  }

  return false;
}

export function isDemandaDoneOn(demanda: Demanda, dateKey: string): boolean {
  if (demanda.recorrencia) {
    return (demanda.feitasEm ?? []).includes(dateKey);
  }
  if (demanda.prazo === dateKey) return demanda.feita;
  return demanda.feita;
}

export function describeRecorrencia(rec?: Recorrencia): string {
  if (!rec) return "Sem recorrência";
  if (rec.tipo === "semanal") {
    return `Toda ${weekdayLabel(rec.diaSemana ?? 0).toLowerCase()}`;
  }
  if (rec.tipo === "quinzenal") {
    return `A cada 2 semanas (${weekdayLabel(rec.diaSemana ?? 0)})`;
  }
  const n = rec.intervaloDias ?? 15;
  const day =
    rec.diaSemana !== undefined
      ? ` · ${weekdayLabel(rec.diaSemana)}`
      : "";
  return `A cada ${n} dias${day}`;
}
