export interface FastingSession {
  id: string;
  startTime: number; // Unix ms timestamp
  endTime: number;   // Unix ms timestamp
  durationSeconds: number;
  goalHours: number;
  goalReached: boolean;
}

export interface ActiveFast {
  startTime: number; // Unix ms timestamp
  goalHours: number; // snapshot of goal when fast started
}

export interface AppSettings {
  goalReachedNotif: boolean;
  reminderStart: boolean;
  reminderEnd: boolean;
  fastingPlanFastHours: number | null;
  fastingPlanEatingHours: number | null;
  fastingStartMinutes: number | null;
}

export interface BarData {
  label: string;
  value: number;
}
