import {
  formatDuration,
  formatElapsed,
  formatMinutes24,
  formatSessionDate,
  formatTime24,
} from '@/utils/format';

describe('formatElapsed', () => {
  it('pads hours, minutes and seconds to two digits', () => {
    expect(formatElapsed(3661)).toBe('01:01:01');
  });

  it('returns all zeros for zero seconds', () => {
    expect(formatElapsed(0)).toBe('00:00:00');
  });

  it('keeps counting hours past 24', () => {
    expect(formatElapsed(100 * 3600)).toBe('100:00:00');
  });
});

describe('formatDuration', () => {
  it('shows only hours when minutes are zero', () => {
    expect(formatDuration(16 * 3600)).toBe('16h');
  });

  it('shows hours and minutes otherwise', () => {
    expect(formatDuration(16 * 3600 + 45 * 60)).toBe('16h 45m');
  });

  it('shows 0h for durations under one hour with no minutes', () => {
    expect(formatDuration(0)).toBe('0h');
  });

  it('drops leftover seconds', () => {
    expect(formatDuration(3600 + 59)).toBe('1h');
  });
});

describe('formatMinutes24', () => {
  it('formats minutes since midnight as HH:MM', () => {
    expect(formatMinutes24(18 * 60 + 5)).toBe('18:05');
  });

  it('wraps past midnight', () => {
    expect(formatMinutes24(24 * 60 + 30)).toBe('00:30');
  });

  it('wraps negative values backwards from midnight', () => {
    expect(formatMinutes24(-30)).toBe('23:30');
  });
});

describe('formatTime24', () => {
  it('formats a timestamp in local time', () => {
    expect(formatTime24(new Date(2026, 5, 17, 9, 7).getTime())).toBe('09:07');
  });
});

describe('formatSessionDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 17, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('says Today for a timestamp from today', () => {
    expect(formatSessionDate(new Date(2026, 5, 17, 1, 0).getTime())).toBe('Today');
  });

  it('says Yesterday for a timestamp from the previous day', () => {
    expect(formatSessionDate(new Date(2026, 5, 16, 23, 0).getTime())).toBe('Yesterday');
  });

  it('uses a short date for older days', () => {
    expect(formatSessionDate(new Date(2026, 5, 1, 10, 0).getTime())).toBe('Jun 1, 2026');
  });
});
