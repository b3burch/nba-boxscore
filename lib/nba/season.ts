import { formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";

export const ET_ZONE = "America/New_York";

export function todayEt(now: Date = new Date()): string {
  return formatInTimeZone(now, ET_ZONE, "yyyy-MM-dd");
}

export function yesterdayEt(now: Date = new Date()): string {
  return formatInTimeZone(subDays(now, 1), ET_ZONE, "yyyy-MM-dd");
}

export function scheduleKey(date: string): string {
  const [y, m, d] = date.split("-");
  return `${m}/${d}/${y} 00:00:00`;
}

export function isOffSeason(now: Date = new Date()): boolean {
  const month = parseInt(formatInTimeZone(now, ET_ZONE, "M"), 10);
  const day = parseInt(formatInTimeZone(now, ET_ZONE, "d"), 10);
  if (month > 6 && month < 10) return true;
  if (month === 6 && day > 22) return true;
  if (month === 10 && day < 15) return true;
  return false;
}

export function currentSeasonString(now: Date = new Date()): string {
  const month = parseInt(formatInTimeZone(now, ET_ZONE, "M"), 10);
  const year = parseInt(formatInTimeZone(now, ET_ZONE, "yyyy"), 10);
  const startYear = month >= 10 ? year : year - 1;
  const endShort = ((startYear + 1) % 100).toString().padStart(2, "0");
  return `${startYear}-${endShort}`;
}
