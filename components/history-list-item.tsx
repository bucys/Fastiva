import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  goalReached: boolean;
  onDelete?: () => void;
}

export default function HistoryListItem({
  date,
  startTime,
  endTime,
  duration,
  goalReached,
  onDelete,
}: Props) {
  const accentColor = goalReached ? Colors.success : Colors.warning;

  function renderRightActions() {
    if (!onDelete) return null;

    return (
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.8}
        style={styles.swipeDeleteAction}
        accessibilityRole="button"
        accessibilityLabel={`Delete fasting session from ${date}`}
      >
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  const content = (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{date}</Text>
          <View style={styles.topRowRight}>
            <View style={[
              styles.badge,
              { backgroundColor: goalReached ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)' },
            ]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>
                {goalReached ? 'Goal met' : 'Partial'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.duration}>{duration}</Text>
        <Text style={styles.times}>{startTime} → {endTime}</Text>
      </View>
    </View>
  );

  if (!onDelete) return content;

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
      containerStyle={styles.swipeContainer}
    >
      {content}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    marginBottom: Spacing.sm,
  },
  swipeDeleteAction: {
    width: 96,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDeleteText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    // Left accent stripe — overridden inline with the goal-status color
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  body: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: Spacing.sm,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    flex: 1,
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
