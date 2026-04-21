import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveFast, AppSettings, FastingSession } from '@/types';
import {
  scheduleGoalNotification,
  cancelGoalNotification,
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
  setGoal: (hours: number) => Promise<void>;
  updateSetting: (key: keyof AppSettings, value: boolean) => Promise<void>;
  _setHasHydrated: (v: boolean) => void;
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
        reminderEnd: true,
        darkMode: true,
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

      setGoal: async (hours) => {
        set({ goalHours: hours });

        // If a fast is active, reschedule the notification for the new goal time
        const { activeFast, settings } = get();
        if (activeFast && settings.goalReachedNotif) {
          const elapsed = Math.floor((Date.now() - activeFast.startTime) / 1000);
          const remaining = Math.max(1, hours * 3600 - elapsed);
          await scheduleGoalNotification(remaining);
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
