import { FastingSession, BarData } from '@/types';

const Y = 2026;
const APR = 3; // April (0-indexed)

function ts(year: number, month: number, day: number, hour: number, minute = 0): number {
  return new Date(year, month, day, hour, minute).getTime();
}

export const MOCK_SESSIONS: FastingSession[] = [
  { id: '1',  startTime: ts(Y, APR, 20, 20), endTime: ts(Y, APR, 21, 12), durationSeconds: 57600,  goalHours: 16, goalReached: true },
  { id: '2',  startTime: ts(Y, APR, 18, 19, 30), endTime: ts(Y, APR, 19, 13, 30), durationSeconds: 64800, goalHours: 16, goalReached: true },
  { id: '3',  startTime: ts(Y, APR, 17, 20), endTime: ts(Y, APR, 18, 10), durationSeconds: 50400,  goalHours: 16, goalReached: false },
  { id: '4',  startTime: ts(Y, APR, 15, 21), endTime: ts(Y, APR, 16, 13), durationSeconds: 57600,  goalHours: 16, goalReached: true },
  { id: '5',  startTime: ts(Y, APR, 14, 20), endTime: ts(Y, APR, 15, 12), durationSeconds: 57600,  goalHours: 16, goalReached: true },
  { id: '6',  startTime: ts(Y, APR, 12, 20, 30), endTime: ts(Y, APR, 13, 11, 30), durationSeconds: 54000, goalHours: 16, goalReached: false },
  { id: '7',  startTime: ts(Y, APR, 11, 21), endTime: ts(Y, APR, 12, 13), durationSeconds: 57600,  goalHours: 16, goalReached: true },
  { id: '8',  startTime: ts(Y, APR, 10, 20), endTime: ts(Y, APR, 11, 14), durationSeconds: 64800,  goalHours: 16, goalReached: true },
  { id: '9',  startTime: ts(Y, APR, 8,  21), endTime: ts(Y, APR, 9,  13), durationSeconds: 57600,  goalHours: 16, goalReached: true },
  { id: '10', startTime: ts(Y, APR, 7,  20), endTime: ts(Y, APR, 8,  12), durationSeconds: 57600,  goalHours: 16, goalReached: true },
];

export const MOCK_WEEK_BARS: BarData[] = [
  { label: 'M', value: 16 },
  { label: 'T', value: 0 },
  { label: 'W', value: 18 },
  { label: 'T', value: 14 },
  { label: 'F', value: 0 },
  { label: 'S', value: 16 },
  { label: 'S', value: 16 },
];

export const MOCK_MONTH_BARS: BarData[] = [
  { label: 'W1', value: 64 },
  { label: 'W2', value: 48 },
  { label: 'W3', value: 80 },
  { label: 'W4', value: 70 },
];

export const MOCK_YEAR_BARS: BarData[] = [
  { label: 'Jan', value: 200 },
  { label: 'Feb', value: 180 },
  { label: 'Mar', value: 240 },
  { label: 'Apr', value: 210 },
  { label: 'May', value: 0 },
  { label: 'Jun', value: 0 },
  { label: 'Jul', value: 0 },
  { label: 'Aug', value: 0 },
  { label: 'Sep', value: 0 },
  { label: 'Oct', value: 0 },
  { label: 'Nov', value: 0 },
  { label: 'Dec', value: 0 },
];
