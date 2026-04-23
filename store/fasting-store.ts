import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveFast, AppSettings, FastingSession } from '@/types';
import {
  cancelStartReminderNotification,
  scheduleGoalNotification,
  cancelGoalNotification,
  scheduleStartReminderNotification,
} from '@/services/notifications';

interface FastingStore {
  // ── state ──────────────────────────────────────────────
  activeFast: ActiveFast | null;
  goalHours: number;
  sessions: FastingSession[];
  settings: AppSettings;
  _hasHydrated: boolean;

  // ── actions ────────────────────────────────────────────
  startFast: () => Promise<void>;
  endFast: () => Promise<void>;
  setGoal: (hours: number, options?: { applyToActiveFast?: boolean }) => Promise<void>;
  setFastingPlan: (fastHours: number | null, eatingHours: number | null) => Promise<void>;
  setFastingStartMinutes: (minutes: number | null) => Promise<void>;
  updateSetting: (key: keyof AppSettings, value: boolean) => Promise<void>;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
  _setHasHydrated: (v: boolean) => void;
}

function isPlanEnabled(settings: AppSettings): boolean {
  return settings.fastingPlanFastHours != null && settings.fastingPlanEatingHours != null;
}

export const useFastingStore = create<FastingStore>()(
  persist(
    (set, get) => ({
      activeFast: null,
      goalHours: 16,
      sessions: [],
      settings: {
        goalReachedNotif: true,
        reminderStart: false,
        fastingPlanFastHours: null,
        fastingPlanEatingHours: null,
        fastingStartMinutes: 18 * 60,
      },
      _hasHydrated: false,

      startFast: async () => {
        const { goalHours, settings } = get();
        const startTime = Date.now();
        set({ activeFast: { startTime, goalHours } });

        if (settings.goalReachedNotif) {
          await scheduleGoalNotification(goalHours * 3600);
        }
      },

      endFast: async () => {
        const { activeFast } = get();
        if (!activeFast) return;

        const endTime = Date.now();
        const durationSeconds = Math.floor((endTime - activeFast.startTime) / 1000);
        const goalReached = durationSeconds >= activeFast.goalHours * 3600;

        const session: FastingSession = {
          id: String(activeFast.startTime),
          startTime: activeFast.startTime,
          endTime,
          durationSeconds,
          goalHours: activeFast.goalHours,
          goalReached,
        };

        set((state) => ({
          activeFast: null,
          sessions: [session, ...state.sessions],
        }));

        await cancelGoalNotification();
      },

      setGoal: async (hours, options) => {
        const applyToActiveFast = options?.applyToActiveFast ?? false;

        set((state) => ({
          goalHours: hours,
          activeFast: state.activeFast
            ? applyToActiveFast
              ? { ...state.activeFast, goalHours: hours }
              : state.activeFast
            : null,
        }));

        // Only reschedule the current-fast notification when the active snapshot changes.
        const { activeFast, settings } = get();
        if (applyToActiveFast && activeFast && settings.goalReachedNotif) {
          const elapsed = Math.floor((Date.now() - activeFast.startTime) / 1000);
          const remaining = Math.max(1, activeFast.goalHours * 3600 - elapsed);
          await scheduleGoalNotification(remaining);
        }
      },

      setFastingPlan: async (fastHours, eatingHours) => {
        set((state) => ({
          goalHours: fastHours ?? state.goalHours,
          settings: {
            ...state.settings,
            fastingPlanFastHours: fastHours,
            fastingPlanEatingHours: eatingHours,
          },
        }));

        const { settings } = get();
        if (settings.reminderStart && isPlanEnabled(settings) && settings.fastingStartMinutes != null) {
          await scheduleStartReminderNotification(settings.fastingStartMinutes);
        } else {
          await cancelStartReminderNotification();
        }
      },

      setFastingStartMinutes: async (minutes) => {
        set((state) => ({
          settings: {
            ...state.settings,
            fastingStartMinutes: minutes,
          },
        }));

        const { settings } = get();
        if (settings.reminderStart && isPlanEnabled(settings) && minutes != null) {
          await scheduleStartReminderNotification(minutes);
        } else {
          await cancelStartReminderNotification();
        }
      },

      updateSetting: async (key, value) => {
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        }));

        // Reschedule / cancel goal notification when its toggle changes
        if (key === 'goalReachedNotif') {
          const { activeFast, goalHours } = get();
          if (activeFast) {
            if (value) {
              const elapsed = Math.floor((Date.now() - activeFast.startTime) / 1000);
              const remaining = Math.max(1, goalHours * 3600 - elapsed);
              await scheduleGoalNotification(remaining);
            } else {
              await cancelGoalNotification();
            }
          }
        }

        if (key === 'reminderStart') {
          const { settings } = get();
          if (value && isPlanEnabled(settings) && settings.fastingStartMinutes != null) {
            await scheduleStartReminderNotification(settings.fastingStartMinutes);
          } else {
            await cancelStartReminderNotification();
          }
        }
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        }));
      },

      clearHistory: () => {
        set({ sessions: [] });
      },

      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'fastiva-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist data — not runtime flags or actions
      partialize: (state) => ({
        activeFast: state.activeFast,
        goalHours: state.goalHours,
        sessions: state.sessions,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);
