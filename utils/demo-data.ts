import { FastingSession } from '@/types';

export const DEMO_SESSION_ID_PREFIX = 'demo-session-';

type DemoSeed = {
  dayOffset: number;
  startHour: number;
  startMinute?: number;
  durationHours: number;
  durationMinutes?: number;
  goalHours: number;
};

const DEMO_SEEDS: DemoSeed[] = [
  { dayOffset: 1, startHour: 19, durationHours: 16, goalHours: 16 },
  { dayOffset: 2, startHour: 20, durationHours: 12, durationMinutes: 30, goalHours: 16 },
  { dayOffset: 3, startHour: 21, durationHours: 18, goalHours: 18 },
  { dayOffset: 4, startHour: 18, durationHours: 0, durationMinutes: 2, goalHours: 16 },
  { dayOffset: 6, startHour: 20, durationHours: 14, goalHours: 14 },
  { dayOffset: 8, startHour: 19, durationHours: 16, durationMinutes: 45, goalHours: 16 },
  { dayOffset: 10, startHour: 22, durationHours: 8, durationMinutes: 40, goalHours: 16 },
  { dayOffset: 12, startHour: 18, durationHours: 20, goalHours: 20 },
  { dayOffset: 15, startHour: 20, durationHours: 0, durationMinutes: 1, goalHours: 16 },
  { dayOffset: 18, startHour: 19, durationHours: 17, durationMinutes: 20, goalHours: 18 },
  { dayOffset: 22, startHour: 21, durationHours: 16, goalHours: 16 },
  { dayOffset: 28, startHour: 18, durationHours: 13, durationMinutes: 50, goalHours: 14 },
  { dayOffset: 35, startHour: 20, durationHours: 18, durationMinutes: 15, goalHours: 18 },
  { dayOffset: 41, startHour: 19, durationHours: 11, durationMinutes: 40, goalHours: 16 },
  { dayOffset: 48, startHour: 20, durationHours: 16, durationMinutes: 5, goalHours: 16 },
  { dayOffset: 55, startHour: 22, durationHours: 20, goalHours: 20 },
  { dayOffset: 63, startHour: 18, durationHours: 15, durationMinutes: 20, goalHours: 16 },
  { dayOffset: 72, startHour: 20, durationHours: 0, durationMinutes: 3, goalHours: 12 },
  { dayOffset: 84, startHour: 19, durationHours: 14, durationMinutes: 10, goalHours: 14 },
  { dayOffset: 97, startHour: 21, durationHours: 18, durationMinutes: 30, goalHours: 18 },
  { dayOffset: 110, startHour: 20, durationHours: 10, durationMinutes: 15, goalHours: 16 },
];

function atLocalTime(baseDate: Date, hour: number, minute: number): Date {
  const next = new Date(baseDate);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export function isDemoSession(session: FastingSession): boolean {
  return session.id.startsWith(DEMO_SESSION_ID_PREFIX);
}

export function buildDemoSessions(now = new Date()): FastingSession[] {
  return DEMO_SEEDS.map((seed, index) => {
    const endTime = atLocalTime(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - seed.dayOffset),
      6 + (index % 7),
      index % 2 === 0 ? 0 : 30,
    );
    const durationMinutes = seed.durationHours * 60 + (seed.durationMinutes ?? 0);
    const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);
    const durationSeconds = durationMinutes * 60;

    return {
      id: `${DEMO_SESSION_ID_PREFIX}${index}-${endTime.getTime()}`,
      startTime: atLocalTime(startTime, startTime.getHours(), startTime.getMinutes()).getTime(),
      endTime: endTime.getTime(),
      durationSeconds,
      goalHours: seed.goalHours,
      goalReached: durationSeconds >= seed.goalHours * 3600,
    };
  }).sort((a, b) => b.endTime - a.endTime);
}
