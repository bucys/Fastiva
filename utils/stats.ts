import { FastingSession, BarData } from '@/types';

export type StatsPeriod = 'week' | 'month' | 'year';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfWeek(date: Date): number {
  const result = startOfDay(date);
  const day = new Date(result).getDay();
  const offset = day === 0 ? 6 : day - 1;
  const start = new Date(result);
  start.setDate(start.getDate() - offset);
  return start.getTime();
}

function startOfMonthTs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function startOfYearTs(date: Date): number {
  return new Date(date.getFullYear(), 0, 1).getTime();
}

function endOfMonthTs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
}

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function roundChartHours(hours: number): number {
  if (hours <= 0) return 0;
  return Math.max(0.1, parseFloat(hours.toFixed(1)));
}

export function computeStreak(sessions: FastingSession[]): number {
  if (!sessions.length) return 0;
  const daySet = new Set(sessions.map((s) => dayKey(s.endTime)));

  let streak = 0;
  const cursor = new Date();
  // Start checking from yesterday — today's fast may still be active
  cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    if (!daySet.has(dayKey(cursor.getTime()))) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function weeklyAverage(sessions: FastingSession[]): number {
  const cutoff = startOfWeek(new Date());
  const recent = sessions.filter((s) => s.endTime >= cutoff);
  if (!recent.length) return 0;
  return Math.round(recent.reduce((sum, s) => sum + s.durationSeconds, 0) / recent.length);
}

export function averageDurationForPeriod(
  sessions: FastingSession[],
  period: StatsPeriod,
  now = new Date(),
): number {
  let cutoff = 0;

  if (period === 'week') cutoff = startOfWeek(now);
  if (period === 'month') cutoff = startOfMonthTs(now);
  if (period === 'year') cutoff = startOfYearTs(now);

  const periodSessions = sessions.filter((session) => session.endTime >= cutoff);
  if (!periodSessions.length) return 0;

  return Math.round(
    periodSessions.reduce((sum, session) => sum + session.durationSeconds, 0) /
      periodSessions.length,
  );
}

export function totalDurationForPeriod(
  sessions: FastingSession[],
  period: StatsPeriod,
  now = new Date(),
): number {
  let cutoff = 0;

  if (period === 'week') cutoff = startOfWeek(now);
  if (period === 'month') cutoff = startOfMonthTs(now);
  if (period === 'year') cutoff = startOfYearTs(now);

  return sessions
    .filter((session) => session.endTime >= cutoff)
    .reduce((sum, session) => sum + session.durationSeconds, 0);
}

export function longestFast(sessions: FastingSession[]): number {
  if (!sessions.length) return 0;
  return Math.max(...sessions.map((s) => s.durationSeconds));
}

export function goalAchievementRate(sessions: FastingSession[]): number {
  if (!sessions.length) return 0;
  const achieved = sessions.filter((s) => s.goalReached).length;
  return Math.round((achieved / sessions.length) * 100);
}

export function computeWeekBars(sessions: FastingSession[]): BarData[] {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const result: BarData[] = labels.map((label) => ({ label, value: 0 }));

  const now = new Date();
  // Find start of current ISO week (Monday)
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  const dow = monday.getDay(); // 0=Sun
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
  const mondayTs = monday.getTime();

  sessions.forEach((s) => {
    if (s.endTime < mondayTs) return;
    const d = new Date(s.endTime);
    const raw = d.getDay(); // 0=Sun,1=Mon,...
    const idx = raw === 0 ? 6 : raw - 1; // convert to Mon=0…Sun=6
    const hours = parseFloat((s.durationSeconds / 3600).toFixed(1));
    // Take the longest fast on a given day
    if (hours > result[idx].value) result[idx].value = hours;
  });

  return result;
}

export function computeMonthBars(sessions: FastingSession[]): BarData[] {
  const now = new Date();
  const monthStart = new Date(startOfMonthTs(now));
  const monthEnd = endOfMonthTs(now);
  const firstWeekStart = new Date(startOfWeek(monthStart));
  const buckets: BarData[] = [];

  for (let index = 0; index < 6; index++) {
    const bucketStart = new Date(firstWeekStart);
    bucketStart.setDate(firstWeekStart.getDate() + index * 7);
    const bucketStartTs = bucketStart.getTime();

    if (bucketStartTs >= monthEnd) break;

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + 7);
    const bucketEndTs = bucketEnd.getTime();

    const total = sessions
      .filter((session) => {
        const endTime = session.endTime;
        return (
          endTime >= bucketStartTs &&
          endTime < bucketEndTs &&
          endTime >= monthStart.getTime() &&
          endTime < monthEnd
        );
      })
      .reduce((sum, session) => sum + session.durationSeconds / 3600, 0);

    buckets.push({
      label: `W${index + 1}`,
      value: roundChartHours(total),
    });
  }

  return buckets;
}

export function computeYearBars(sessions: FastingSession[]): BarData[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthLabels = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return monthLabels.map((label, i) => {
    if (i > currentMonth) return { label, value: 0 };
    const total = sessions
      .filter((s) => {
        const d = new Date(s.endTime);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      })
      .reduce((sum, s) => sum + s.durationSeconds / 3600, 0);
    return { label, value: roundChartHours(total) };
  });
}
