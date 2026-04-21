import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  hours: number;
}

export default function GoalPill({ hours }: Props) {
  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.text}>Goal: {hours}h</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    // Purple-tinted background so the pill reads as a fasting-state indicator, not just a label
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.28)',
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    gap: 7,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  text: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    opacity: 0.85,
    letterSpacing: 0.2,
  },
});
