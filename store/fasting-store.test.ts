import { act } from 'react';
import { FastingSession } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/services/notifications', () => ({
  scheduleGoalNotification: jest.fn().mockResolvedValue(undefined),
  cancelGoalNotification: jest.fn().mockResolvedValue(undefined),
  scheduleStartReminderNotification: jest.fn().mockResolvedValue(undefined),
  cancelStartReminderNotification: jest.fn().mockResolvedValue(undefined),
}));

import { useFastingStore } from '@/store/fasting-store';
import {
  cancelGoalNotification,
  cancelStartReminderNotification,
  scheduleGoalNotification,
  scheduleStartReminderNotification,
} from '@/services/notifications';

const NOW = new Date(2026, 5, 17, 12, 0, 0).getTime();
const HOUR_MS = 3600 * 1000;

const initialState = useFastingStore.getState();

function store() {
  return useFastingStore.getState();
}

function makeSession(id: string, endTime: number): FastingSession {
  return {
    id,
    startTime: endTime - 16 * HOUR_MS,
    endTime,
    durationSeconds: 16 * 3600,
    goalHours: 16,
    goalReached: true,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  useFastingStore.setState(initialState, true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('startFast', () => {
  it('snapshots the current goal and start time', async () => {
    await act(() => store().setGoal(18));
    await act(() => store().startFast());

    expect(store().activeFast).toEqual({ startTime: NOW, goalHours: 18 });
  });

  it('schedules the goal notification for the full goal when enabled', async () => {
    await act(() => store().startFast());

    expect(scheduleGoalNotification).toHaveBeenCalledWith(16 * 3600);
  });

  it('does not schedule a notification when goal alerts are off', async () => {
    await act(() => store().updateSetting('goalReachedNotif', false));
    await act(() => store().startFast());

    expect(scheduleGoalNotification).not.toHaveBeenCalled();
  });
});

describe('endFast', () => {
  it('does nothing when no fast is active', async () => {
    await act(() => store().endFast());

    expect(store().sessions).toEqual([]);
    expect(cancelGoalNotification).not.toHaveBeenCalled();
  });

  it('saves a session marked goal reached when the goal was met', async () => {
    await act(() => store().startFast());
    jest.setSystemTime(NOW + 16 * HOUR_MS);
    await act(() => store().endFast());

    expect(store().activeFast).toBeNull();
    expect(store().sessions).toEqual([
      {
        id: String(NOW),
        startTime: NOW,
        endTime: NOW + 16 * HOUR_MS,
        durationSeconds: 16 * 3600,
        goalHours: 16,
        goalReached: true,
      },
    ]);
  });

  it('marks the goal as not reached when ended early', async () => {
    await act(() => store().startFast());
    jest.setSystemTime(NOW + 15 * HOUR_MS);
    await act(() => store().endFast());

    expect(store().sessions[0].goalReached).toBe(false);
  });

  it('puts the newest session first and cancels the goal notification', async () => {
    useFastingStore.setState({ sessions: [makeSession('old', NOW - 48 * HOUR_MS)] });
    await act(() => store().startFast());
    jest.setSystemTime(NOW + HOUR_MS);
    await act(() => store().endFast());

    expect(store().sessions.map((s) => s.id)).toEqual([String(NOW), 'old']);
    expect(cancelGoalNotification).toHaveBeenCalled();
  });
});

describe('setGoal', () => {
  it('leaves the active fast on its original goal by default', async () => {
    await act(() => store().startFast());
    await act(() => store().setGoal(20));

    expect(store().goalHours).toBe(20);
    expect(store().activeFast?.goalHours).toBe(16);
    expect(scheduleGoalNotification).toHaveBeenCalledTimes(1);
  });

  it('applies to the active fast and reschedules for the remaining time', async () => {
    await act(() => store().startFast());
    jest.setSystemTime(NOW + 2 * HOUR_MS);
    await act(() => store().setGoal(20, { applyToActiveFast: true }));

    expect(store().activeFast?.goalHours).toBe(20);
    expect(scheduleGoalNotification).toHaveBeenLastCalledWith(18 * 3600);
  });

  it('schedules at least one second when the new goal is already passed', async () => {
    await act(() => store().startFast());
    jest.setSystemTime(NOW + 10 * HOUR_MS);
    await act(() => store().setGoal(8, { applyToActiveFast: true }));

    expect(scheduleGoalNotification).toHaveBeenLastCalledWith(1);
  });

  it('works with no active fast', async () => {
    await act(() => store().setGoal(14, { applyToActiveFast: true }));

    expect(store().goalHours).toBe(14);
    expect(store().activeFast).toBeNull();
  });
});

describe('setFastingPlan', () => {
  it('sets the goal from the plan fasting hours', async () => {
    await act(() => store().setFastingPlan(18, 6));

    expect(store().goalHours).toBe(18);
    expect(store().settings.fastingPlanFastHours).toBe(18);
    expect(store().settings.fastingPlanEatingHours).toBe(6);
  });

  it('keeps the goal when the plan is cleared', async () => {
    await act(() => store().setFastingPlan(18, 6));
    await act(() => store().setFastingPlan(null, null));

    expect(store().goalHours).toBe(18);
    expect(store().settings.fastingPlanFastHours).toBeNull();
  });

  it('schedules the start reminder when reminders are on and a plan exists', async () => {
    await act(() => store().updateSetting('reminderStart', true));
    await act(() => store().setFastingPlan(16, 8));

    expect(scheduleStartReminderNotification).toHaveBeenCalledWith(18 * 60);
  });

  it('cancels the start reminder when the plan is cleared', async () => {
    await act(() => store().updateSetting('reminderStart', true));
    await act(() => store().setFastingPlan(null, null));

    expect(cancelStartReminderNotification).toHaveBeenCalled();
  });
});

describe('updateSetting', () => {
  it('cancels the goal notification when alerts are turned off mid fast', async () => {
    await act(() => store().startFast());
    await act(() => store().updateSetting('goalReachedNotif', false));

    expect(cancelGoalNotification).toHaveBeenCalled();
  });

  it('reschedules the goal notification when alerts are turned on mid fast', async () => {
    await act(() => store().updateSetting('goalReachedNotif', false));
    await act(() => store().startFast());
    jest.setSystemTime(NOW + 4 * HOUR_MS);
    await act(() => store().updateSetting('goalReachedNotif', true));

    expect(scheduleGoalNotification).toHaveBeenCalledWith(12 * 3600);
  });

  it('does not touch goal notifications when no fast is active', async () => {
    await act(() => store().updateSetting('goalReachedNotif', false));

    expect(cancelGoalNotification).not.toHaveBeenCalled();
    expect(scheduleGoalNotification).not.toHaveBeenCalled();
  });

  it('cancels the start reminder when turned on without a plan', async () => {
    await act(() => store().updateSetting('reminderStart', true));

    expect(scheduleStartReminderNotification).not.toHaveBeenCalled();
    expect(cancelStartReminderNotification).toHaveBeenCalled();
  });
});

describe('setFastingStartMinutes', () => {
  it('stores the new start time and reschedules when a plan and reminder exist', async () => {
    await act(() => store().setFastingPlan(16, 8));
    await act(() => store().updateSetting('reminderStart', true));
    await act(() => store().setFastingStartMinutes(20 * 60));

    expect(store().settings.fastingStartMinutes).toBe(20 * 60);
    expect(scheduleStartReminderNotification).toHaveBeenLastCalledWith(20 * 60);
  });

  it('cancels the reminder when the start time is cleared', async () => {
    await act(() => store().setFastingStartMinutes(null));

    expect(cancelStartReminderNotification).toHaveBeenCalled();
  });
});

describe('session management', () => {
  it('deleteSession removes only the matching session', () => {
    useFastingStore.setState({ sessions: [makeSession('a', NOW), makeSession('b', NOW - HOUR_MS)] });

    act(() => store().deleteSession('a'));

    expect(store().sessions.map((s) => s.id)).toEqual(['b']);
  });

  it('clearHistory removes every session but keeps settings and goal', () => {
    useFastingStore.setState({ sessions: [makeSession('a', NOW)], goalHours: 18 });

    act(() => store().clearHistory());

    expect(store().sessions).toEqual([]);
    expect(store().goalHours).toBe(18);
  });
});

describe('demo sessions (dev only)', () => {
  const demo = (n: number) => makeSession(`demo-session-${n}`, NOW - n * 24 * HOUR_MS);

  it('seeds demo sessions next to real ones, newest first', () => {
    const real = makeSession('real', NOW - 12 * HOUR_MS);
    useFastingStore.setState({ sessions: [real] });

    act(() => store().seedDemoSessions([demo(1), demo(3)]));

    expect(store().sessions.map((s) => s.id)).toEqual(['real', 'demo-session-1', 'demo-session-3']);
  });

  it('replaces old demo sessions when seeding again, keeping real ones', () => {
    const real = makeSession('real', NOW);
    useFastingStore.setState({ sessions: [real, demo(1)] });

    act(() => store().seedDemoSessions([demo(2)]));

    expect(store().sessions.map((s) => s.id)).toEqual(['real', 'demo-session-2']);
  });

  it('replaceExisting drops real sessions too', () => {
    useFastingStore.setState({ sessions: [makeSession('real', NOW)] });

    act(() => store().seedDemoSessions([demo(1)], { replaceExisting: true }));

    expect(store().sessions.map((s) => s.id)).toEqual(['demo-session-1']);
  });

  it('clearDemoSessions removes only demo sessions', () => {
    useFastingStore.setState({ sessions: [makeSession('real', NOW), demo(1)] });

    act(() => store().clearDemoSessions());

    expect(store().sessions.map((s) => s.id)).toEqual(['real']);
  });

  it('does nothing outside dev builds', () => {
    const original = (globalThis as unknown as { __DEV__: boolean }).__DEV__;
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    try {
      useFastingStore.setState({ sessions: [] });
      act(() => store().seedDemoSessions([demo(1)]));
      expect(store().sessions).toEqual([]);
    } finally {
      (globalThis as unknown as { __DEV__: boolean }).__DEV__ = original;
    }
  });
});
