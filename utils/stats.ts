import { FastingSession, BarData } from '@/types';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  const recent = sessions.filter((s) => s.endTime >= cutoff);
  if (!recent.length) return 0;
  return Math.round(recent.reduce((sum, s) => sum + s.durationSeconds, 0) / recent.length);
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
  const now = Date.now();
  return [3, 2, 1, 0].map((weeksAgo) => {
    const end = now - weeksAgo * 7 * 24 * 3600 * 1000;
    const start = end - 7 * 24 * 3600 * 1000;
    const total = sessions
      .filter((s) => s.endTime >= start && s.endTime < end)
      .reduce((sum, s) => sum + s.durationSeconds / 3600, 0);
    return { label: `W${4 - weeksAgo}`, value: Math.round(total) };
  });
}

export function computeYearBars(sessions: FastingSession[]): BarData[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return monthLabels.map((label, i) => {
    if (i > currentMonth) return { label, value: 0 };
    const total = sessions
      .filter((s) => {
        const d = new Date(s.endTime);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      })
      .reduce((sum, s) => sum + s.durationSeconds / 3600, 0);
    return { label, value: Math.round(total) };
  });
}
