import { FastingSession } from '@/types';
import {
  averageDurationForPeriod,
  computeMonthBars,
  computeStreak,
  computeWeekBars,
  computeYearBars,
  filterSessionsForPeriod,
  getSessionCompletionPercent,
  getSessionStatus,
  goalAchievementRate,
  longestFast,
  totalDurationForPeriod,
  weeklyAverage,
} from '@/utils/stats';

// Wednesday, 17 June 2026, noon local time
const NOW = new Date(2026, 5, 17, 12, 0, 0);
const HOUR = 3600;

function session(overrides: Partial<FastingSession> & { end: Date }): FastingSession {
  const durationSeconds = overrides.durationSeconds ?? 16 * HOUR;
  const endTime = overrides.end.getTime();
  return {
    id: String(endTime),
    startTime: endTime - durationSeconds * 1000,
    endTime,
    durationSeconds,
    goalHours: 16,
    goalReached: durationSeconds >= 16 * HOUR,
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getSessionCompletionPercent', () => {
  it('returns the rounded share of the goal completed', () => {
    expect(getSessionCompletionPercent(session({ end: NOW, durationSeconds: 12 * HOUR }))).toBe(75);
  });

  it('goes above 100 when the goal is exceeded', () => {
    expect(getSessionCompletionPercent(session({ end: NOW, durationSeconds: 24 * HOUR }))).toBe(150);
  });

  it('returns 0 when the goal is zero hours', () => {
    expect(getSessionCompletionPercent(session({ end: NOW, goalHours: 0 }))).toBe(0);
  });
});

describe('getSessionStatus', () => {
  it.each([
    [16 * HOUR, 'Goal met'],
    [11.2 * HOUR, 'Partial'],
    [11.1 * HOUR, 'Missed'],
    [0, 'Missed'],
  ])('maps %s seconds to %s', (durationSeconds, expected) => {
    expect(getSessionStatus(session({ end: NOW, durationSeconds }))).toBe(expected);
  });
});

describe('computeStreak', () => {
  const daysAgo = (n: number) => new Date(2026, 5, 17 - n, 20, 0);

  it('returns 0 with no sessions', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 when no session reached its goal', () => {
    expect(computeStreak([session({ end: NOW, durationSeconds: 2 * HOUR })])).toBe(0);
  });

  it('counts consecutive goal days ending today', () => {
    const sessions = [0, 1, 2].map((n) => session({ end: daysAgo(n) }));
    expect(computeStreak(sessions)).toBe(3);
  });

  it('keeps the streak alive when today has no goal yet but yesterday does', () => {
    const sessions = [1, 2].map((n) => session({ end: daysAgo(n) }));
    expect(computeStreak(sessions)).toBe(2);
  });

  it('breaks at a missed day', () => {
    const sessions = [0, 1, 3].map((n) => session({ end: daysAgo(n) }));
    expect(computeStreak(sessions)).toBe(2);
  });

  it('returns 0 when the last goal day was two or more days ago', () => {
    expect(computeStreak([session({ end: daysAgo(2) })])).toBe(0);
  });

  it('counts a day once when it has several goal sessions', () => {
    const sessions = [session({ end: daysAgo(0) }), session({ end: new Date(2026, 5, 17, 8, 0) })];
    expect(computeStreak(sessions)).toBe(1);
  });
});

describe('filterSessionsForPeriod', () => {
  const sunday = session({ end: new Date(2026, 5, 14, 23, 0) });
  const monday = session({ end: new Date(2026, 5, 15, 0, 0) });
  const earlierMonth = session({ end: new Date(2026, 5, 2, 10, 0) });
  const lastMonth = session({ end: new Date(2026, 4, 31, 10, 0) });
  const lastYear = session({ end: new Date(2025, 11, 31, 10, 0) });
  const all = [sunday, monday, earlierMonth, lastMonth, lastYear];

  it('week starts on Monday', () => {
    expect(filterSessionsForPeriod(all, 'week', NOW)).toEqual([monday]);
  });

  it('month starts on the 1st', () => {
    expect(filterSessionsForPeriod(all, 'month', NOW)).toEqual([sunday, monday, earlierMonth]);
  });

  it('year starts on 1 January', () => {
    expect(filterSessionsForPeriod(all, 'year', NOW)).toEqual([
      sunday,
      monday,
      earlierMonth,
      lastMonth,
    ]);
  });
});

describe('averages and totals', () => {
  const sessions = [
    session({ end: new Date(2026, 5, 16, 20, 0), durationSeconds: 10 * HOUR }),
    session({ end: new Date(2026, 5, 17, 8, 0), durationSeconds: 20 * HOUR }),
    session({ end: new Date(2026, 4, 1, 8, 0), durationSeconds: 30 * HOUR }),
  ];

  it('weeklyAverage averages only this week', () => {
    expect(weeklyAverage(sessions)).toBe(15 * HOUR);
  });

  it('weeklyAverage is 0 when the week is empty', () => {
    expect(weeklyAverage([sessions[2]])).toBe(0);
  });

  it('averageDurationForPeriod is 0 for an empty period', () => {
    expect(averageDurationForPeriod([], 'month', NOW)).toBe(0);
  });

  it('totalDurationForPeriod sums only sessions in the period', () => {
    expect(totalDurationForPeriod(sessions, 'month', NOW)).toBe(30 * HOUR);
    expect(totalDurationForPeriod(sessions, 'year', NOW)).toBe(60 * HOUR);
  });

  it('longestFast returns the max duration, or 0 when empty', () => {
    expect(longestFast(sessions)).toBe(30 * HOUR);
    expect(longestFast([])).toBe(0);
  });

  it('goalAchievementRate returns a rounded percent, or 0 when empty', () => {
    expect(goalAchievementRate(sessions)).toBe(67);
    expect(goalAchievementRate([])).toBe(0);
  });
});

describe('computeWeekBars', () => {
  it('returns seven bars labelled Monday to Sunday, all zero when empty', () => {
    const bars = computeWeekBars([]);
    expect(bars.map((b) => b.label)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(bars.every((b) => b.value === 0)).toBe(true);
  });

  it('puts a session on its end day and keeps the longest fast of the day', () => {
    const bars = computeWeekBars([
      session({ end: new Date(2026, 5, 17, 8, 0), durationSeconds: 12 * HOUR }),
      session({ end: new Date(2026, 5, 17, 20, 0), durationSeconds: 18 * HOUR }),
    ]);
    expect(bars[2].value).toBe(18);
  });

  it('ignores sessions from before this week', () => {
    const bars = computeWeekBars([session({ end: new Date(2026, 5, 14, 20, 0) })]);
    expect(bars.every((b) => b.value === 0)).toBe(true);
  });

  it('places a Sunday session in the last bar', () => {
    jest.setSystemTime(new Date(2026, 5, 21, 12, 0));
    const bars = computeWeekBars([session({ end: new Date(2026, 5, 21, 8, 0) })]);
    expect(bars[6].value).toBe(16);
  });
});

describe('computeMonthBars', () => {
  it('labels weekly buckets W1.. and covers every week touching the month', () => {
    const bars = computeMonthBars([]);
    expect(bars.map((b) => b.label)).toEqual(['W1', 'W2', 'W3', 'W4', 'W5']);
  });

  it('sums hours into the right week bucket', () => {
    const bars = computeMonthBars([
      session({ end: new Date(2026, 5, 2, 10, 0), durationSeconds: 10 * HOUR }),
      session({ end: new Date(2026, 5, 3, 10, 0), durationSeconds: 5 * HOUR }),
      session({ end: new Date(2026, 5, 17, 10, 0), durationSeconds: 8 * HOUR }),
    ]);
    expect(bars[0].value).toBe(15);
    expect(bars[2].value).toBe(8);
  });

  it('excludes sessions from other months', () => {
    const bars = computeMonthBars([session({ end: new Date(2026, 4, 31, 10, 0) })]);
    expect(bars.every((b) => b.value === 0)).toBe(true);
  });

  it('shows a tiny nonzero value as at least 0.1 so the bar stays visible', () => {
    const bars = computeMonthBars([
      session({ end: new Date(2026, 5, 2, 10, 0), durationSeconds: 60 }),
    ]);
    expect(bars[0].value).toBe(0.1);
  });
});

describe('computeYearBars', () => {
  it('returns twelve bars labelled 1 to 12', () => {
    const bars = computeYearBars([]);
    expect(bars).toHaveLength(12);
    expect(bars[0].label).toBe('1');
    expect(bars[11].label).toBe('12');
  });

  it('sums hours per month of the current year only', () => {
    const bars = computeYearBars([
      session({ end: new Date(2026, 0, 10), durationSeconds: 10 * HOUR }),
      session({ end: new Date(2026, 0, 11), durationSeconds: 6 * HOUR }),
      session({ end: new Date(2025, 0, 10), durationSeconds: 50 * HOUR }),
    ]);
    expect(bars[0].value).toBe(16);
  });

  it('leaves future months at zero', () => {
    const bars = computeYearBars([]);
    expect(bars.slice(6).every((b) => b.value === 0)).toBe(true);
  });
});
