export interface FastingSession {
  id: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  goalHours: number;
  goalReached: boolean;
}

export interface BarData {
  label: string;
  value: number;
}
