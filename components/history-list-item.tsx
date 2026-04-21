import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  goalReached: boolean;
}

export default function HistoryListItem({ date, startTime, endTime, duration, goalReached }: Props) {
  const accentColor = goalReached ? Colors.success : Colors.warning;

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{date}</Text>
          <View style={[
            styles.badge,
            { backgroundColor: goalReached ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)' },
          ]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>
              {goalReached ? 'Goal met' : 'Partial'}
            </Text>
          </View>
        </View>
        <Text style={styles.duration}>{duration}</Text>
        <Text style={styles.times}>{startTime} → {endTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    // Left accent stripe — overridden inline with the goal-status color
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  body: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  date: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  duration: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  times: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});
