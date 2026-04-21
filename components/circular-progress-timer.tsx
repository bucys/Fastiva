import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Typography } from '@/constants/theme';
import { formatElapsed } from '@/utils/format';

interface Props {
  progress: number;
  elapsedSeconds: number;
  isActive: boolean;
}

const STROKE_WIDTH = 18;
// Track is a neutral white-tint so it reads against any background shade
const TRACK_COLOR = 'rgba(255,255,255,0.09)';

export default function CircularProgressTimer({ progress, elapsedSeconds, isActive }: Props) {
  const { width } = useWindowDimensions();
  const SIZE = Math.round(width * 0.68);
  const RADIUS = (SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const clamped = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clamped);
  const goalReached = progress >= 1;
  const nearingGoal = progress >= 0.7 && progress < 1;
  const progressGradientId = goalReached
    ? 'progressGradSuccess'
    : nearingGoal
    ? 'progressGradBoost'
    : 'progressGradBrand';

  const arcColor = goalReached ? Colors.success : `url(#${progressGradientId})`;
  const timeColor = goalReached ? Colors.success : nearingGoal ? '#86EFAC' : Colors.textPrimary;
  const percentColor = goalReached ? Colors.success : nearingGoal ? '#BBF7D0' : Colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="progressGradBrand" x1="0%" y1="0%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity={1} />
            <Stop offset="100%" stopColor={Colors.secondary} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="progressGradBoost" x1="0%" y1="0%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
            <Stop offset="100%" stopColor="#34D399" stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="progressGradSuccess" x1="0%" y1="0%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#22C55E" stopOpacity={1} />
            <Stop offset="100%" stopColor="#4ADE80" stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={TRACK_COLOR}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />

        {/* progress arc */}
        {(isActive || goalReached) && (
          <G rotation="-90" origin={`${SIZE / 2},${SIZE / 2}`}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={arcColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        )}
      </Svg>

      {/* inner content overlay */}
      <View style={[StyleSheet.absoluteFill, styles.inner]}>
        {isActive ? (
          <>
            <Text style={styles.statusLabel}>{goalReached ? 'DONE' : 'FASTING'}</Text>
            <Text style={[styles.timeText, { color: timeColor }]}>
              {formatElapsed(elapsedSeconds)}
            </Text>
            <Text style={[styles.percentText, { color: percentColor }]}>
              {Math.min(100, Math.round(clamped * 100))}%
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.statusLabel}>READY</Text>
            <Text style={[styles.timeText, styles.timeInactive]}>00:00:00</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 40,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    lineHeight: 44,
  },
  timeInactive: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  percentText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
