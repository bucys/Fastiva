import { StyleSheet, Text, View } from 'react-native';
import { BarData } from '@/types';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  data: BarData[];
  unit?: string;
  highlightIndex?: number;
}

const BAR_MAX_HEIGHT = 100;

export default function BarChart({ data, unit = 'h', highlightIndex }: Props) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {data.map((item, i) => {
          const barHeight = Math.max((item.value / maxValue) * BAR_MAX_HEIGHT, item.value > 0 ? 4 : 0);
          const isHighlight = i === highlightIndex;
          const hasValue = item.value > 0;
          return (
            <View key={i} style={styles.barColumn}>
              {hasValue ? (
                <Text style={styles.valueLabel}>
                  {item.value}{unit}
                </Text>
              ) : (
                <Text style={styles.valueLabelEmpty}> </Text>
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isHighlight
                        ? Colors.accent
                        : hasValue
                        ? Colors.primary
                        : Colors.cardSecondary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isHighlight && { color: Colors.textPrimary }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: Spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  valueLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  valueLabelEmpty: {
    fontSize: Typography.sizes.sm,
  },
  dayLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});
