import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { FastingSession } from '@/types';
import { formatDuration, formatTime24 } from '@/utils/format';

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatGoalCompletionPercent(session: FastingSession): string {
  const goalSeconds = session.goalHours * 3600;
  if (goalSeconds <= 0) return '0%';
  const percent = Math.round((session.durationSeconds / goalSeconds) * 100);
  return `${percent}%`;
}

export function getCompletedSessions(sessions: FastingSession[]): FastingSession[] {
  return sessions.filter(
    (session) =>
      Number.isFinite(session.startTime) &&
      Number.isFinite(session.endTime) &&
      session.endTime > session.startTime &&
      session.durationSeconds > 0,
  );
}

export function buildSessionsCsv(sessions: FastingSession[]): string {
  const completedSessions = getCompletedSessions(sessions);
  const header = [
    'date',
    'start time',
    'end time',
    'duration',
    'goal',
    'goal completion percent',
  ];

  const rows = completedSessions.map((session) => {
    const date = format(new Date(session.endTime), 'yyyy-MM-dd');
    return [
      date,
      formatTime24(session.startTime),
      formatTime24(session.endTime),
      formatDuration(session.durationSeconds),
      `${session.goalHours}h`,
      formatGoalCompletionPercent(session),
    ].map((value) => escapeCsvValue(value));
  });

  return [header, ...rows].map((row) => row.join(',')).join('\n');
}

export async function exportSessionsCsv(sessions: FastingSession[]): Promise<string> {
  const completedSessions = getCompletedSessions(sessions);
  if (!completedSessions.length) {
    throw new Error('NO_COMPLETED_SESSIONS');
  }

  const csv = buildSessionsCsv(sessions);
  const fileName = `fastiva-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!directory) {
    throw new Error('EXPORT_DIRECTORY_UNAVAILABLE');
  }

  const fileUri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}

export async function shareExportedFile(fileUri: string): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return false;

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export fasting data',
    UTI: 'public.comma-separated-values-text',
  });

  return true;
}
