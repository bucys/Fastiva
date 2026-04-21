import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const GOAL_NOTIF_ID = 'fastiva-goal-reached';
export const START_REMINDER_NOTIF_ID = 'fastiva-start-reminder';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('fastiva', {
    name: 'Fastiva',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function scheduleGoalNotification(remainingSeconds: number): Promise<void> {
  if (remainingSeconds <= 0) return;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // Cancel any existing notification for the same event first
    await cancelGoalNotification();

    await Notifications.scheduleNotificationAsync({
      identifier: GOAL_NOTIF_ID,
      content: {
        title: 'Fast Complete! 🎉',
        body: "You've reached your fasting goal. Great work!",
        sound: true,
        data: { type: 'goal-reached' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: remainingSeconds,
        repeats: false,
      },
    });
  } catch {
    // Notifications are non-critical — silently ignore failures (simulator, web, etc.)
  }
}

export async function cancelGoalNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(GOAL_NOTIF_ID);
  } catch {
    // Ignore — notification may not exist
  }
}

export async function scheduleStartReminderNotification(
  startMinutes: number | null,
): Promise<void> {
  if (startMinutes == null) return;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await cancelStartReminderNotification();

    const hour = Math.floor(startMinutes / 60);
    const minute = startMinutes % 60;

    await Notifications.scheduleNotificationAsync({
      identifier: START_REMINDER_NOTIF_ID,
      content: {
        title: 'Ready to start fasting?',
        body: 'Your fasting window is about to begin.',
        sound: true,
        data: { type: 'start-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Non-critical notification path
  }
}

export async function cancelStartReminderNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(START_REMINDER_NOTIF_ID);
  } catch {
    // Ignore — notification may not exist
  }
}
