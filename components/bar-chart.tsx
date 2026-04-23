import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarData } from '@/types';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  data: BarData[];
  highlightIndex?: number;
  onSelectBar?: (index: number) => void;
  onClearSelection?: () => void;
}

const BAR_MAX_HEIGHT = 100;
const SELECTED_VALUE_ROW_HEIGHT = 24;

function formatSelectedValue(value: number): string {
  return `${Math.floor(value)}h`;
}

export default function BarChart({ data, highlightIndex, onSelectBar, onClearSelection }: Props) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Pressable style={styles.container} onPress={onClearSelection}>
      <View style={styles.selectedValueRow}>
        {data.map((item, i) => {
          const isHighlight = i === highlightIndex;
          return (
            <View key={`selected-${i}`} style={styles.selectedValueColumn}>
              {isHighlight ? (
                <View style={styles.selectedValueInner}>
                  <Text style={styles.selectedValueText}>
                    {formatSelectedValue(item.value)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.barsRow}>
        {data.map((item, i) => {
          const barHeight = Math.max((item.value / maxValue) * BAR_MAX_HEIGHT, item.value > 0 ? 4 : 0);
          const isHighlight = i === highlightIndex;
          const hasValue = item.value > 0;
          return (
            <TouchableOpacity
              key={i}
              style={styles.barColumn}
              activeOpacity={0.85}
              onPress={() => {
                if (!hasValue) return;
                onSelectBar?.(i);
              }}
              disabled={!hasValue}
            >
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
            </TouchableOpacity>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  selectedValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: Spacing.xs,
    height: SELECTED_VALUE_ROW_HEIGHT,
    marginBottom: Spacing.xs,
    overflow: 'visible',
    zIndex: 1,
  },
  selectedValueColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    position: 'relative',
  },
  selectedValueInner: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  selectedValueText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    flexShrink: 0,
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
    gap: 6,
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
  dayLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    fontVariant: ['tabular-nums'],
  },
});
