import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import CircularProgressTimer from '@/components/circular-progress-timer';
import GoalPill from '@/components/goal-pill';
import PrimaryButton from '@/components/primary-button';
import SmallMetricCard from '@/components/small-metric-card';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { MOCK_SESSIONS } from '@/utils/mock-data';
import { formatDuration, formatElapsed } from '@/utils/format';

const GOAL_HOURS = 16;
const GOAL_SECONDS = GOAL_HOURS * 3600;

const longestFastSeconds = Math.max(...MOCK_SESSIONS.map((s) => s.durationSeconds));
const lastFastSeconds = MOCK_SESSIONS[0]?.durationSeconds ?? 0;
const streak = 5;

export default function HomeScreen() {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setElapsedSeconds(0);
      return;
    }
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const progress = elapsedSeconds / GOAL_SECONDS;
  const goalReached = elapsedSeconds >= GOAL_SECONDS;
  const remaining = Math.max(0, GOAL_SECONDS - elapsedSeconds);

  function handleToggle() {
    setIsActive((prev) => !prev);
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.topSection}>
          <Text style={styles.currentFastLabel}>Current Fast</Text>
          <GoalPill hours={GOAL_HOURS} />
        </View>

        {/* timer */}
        <View style={styles.timerSection}>
          <CircularProgressTimer
            progress={progress}
            elapsedSeconds={elapsedSeconds}
            isActive={isActive}
          />
        </View>

        {/* status */}
        <View style={styles.statusSection}>
          {isActive ? (
            goalReached ? (
              <Text style={[styles.statusText, styles.statusSuccess]}>Goal reached!</Text>
            ) : (
              <Text style={styles.statusText}>
                Goal in{' '}
                <Text style={styles.statusHighlight}>{formatElapsed(remaining)}</Text>
              </Text>
            )
          ) : (
            <Text style={styles.statusText}>Ready to start your fast</Text>
          )}
        </View>

        {/* button */}
        <PrimaryButton
          label={isActive ? 'End Fast' : 'Start Fast'}
          onPress={handleToggle}
          variant={isActive ? 'danger' : 'primary'}
          style={styles.button}
        />

        {/* stat cards */}
        <View style={styles.statsRow}>
          <SmallMetricCard label="Streak" value={`${streak}d`} />
          <SmallMetricCard label="Last Fast" value={formatDuration(lastFastSeconds)} />
          <SmallMetricCard label="Longest" value={formatDuration(longestFastSeconds)} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  currentFastLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 24,
  },
  statusText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  statusHighlight: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
    fontVariant: ['tabular-nums'],
  },
  statusSuccess: {
    color: Colors.success,
    fontWeight: Typography.weights.semibold,
  },
  button: {
    marginHorizontal: Spacing.lg,
    alignSelf: 'stretch',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
});
