import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}

export default function SegmentedControl({ options, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {options.map((option, i) => {
        const active = i === selected;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onSelect(i)}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.lg,
    padding: 3,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.card,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
});
