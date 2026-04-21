import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import CircularProgressTimer from '@/components/circular-progress-timer';
import GoalPill from '@/components/goal-pill';
import PrimaryButton from '@/components/primary-button';
import SmallMetricCard from '@/components/small-metric-card';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useFastingStore } from '@/store/fasting-store';
import { MOCK_SESSIONS } from '@/utils/mock-data';
import { formatDuration, formatElapsed } from '@/utils/format';
import {
  computeStreak,
  longestFast,
  weeklyAverage,
} from '@/utils/stats';

export default function HomeScreen() {
  const {
    activeFast,
    goalHours,
    sessions,
    startFast,
    endFast,
    _hasHydrated,
  } = useFastingStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute elapsed from the persisted startTime whenever activeFast changes
  function refreshElapsed() {
    if (!activeFast) {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(Math.floor((Date.now() - activeFast.startTime) / 1000));
  }

  useEffect(() => {
    refreshElapsed();

    if (!activeFast) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(refreshElapsed, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFast]);

  // Jump to correct time when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refreshElapsed();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFast]);

  const goalSeconds = goalHours * 3600;
  const progress = goalSeconds > 0 ? elapsedSeconds / goalSeconds : 0;
  const goalReached = elapsedSeconds >= goalSeconds && !!activeFast;
  const remaining = Math.max(0, goalSeconds - elapsedSeconds);

  // Stats — prefer real sessions, fall back to mock when empty
  const displaySessions = sessions.length > 0 ? sessions : MOCK_SESSIONS;
  const streak = computeStreak(displaySessions);
  const lastFastSec = displaySessions[0]?.durationSeconds ?? 0;
  const longestSec = longestFast(displaySessions);
  const weekAvgSec = weeklyAverage(displaySessions);

  const isActive = _hasHydrated && !!activeFast;

  async function handleToggle() {
    if (isActive) {
      await endFast();
    } else {
      await startFast();
    }
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
          <GoalPill hours={goalHours} />
        </View>

        {/* timer */}
        <View style={styles.timerSection}>
          <CircularProgressTimer
            progress={_hasHydrated ? progress : 0}
            elapsedSeconds={_hasHydrated ? elapsedSeconds : 0}
            isActive={isActive}
          />
        </View>

        {/* status line */}
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

        {/* primary action */}
        <PrimaryButton
          label={isActive ? 'End Fast' : 'Start Fast'}
          onPress={handleToggle}
          variant={isActive ? 'danger' : 'primary'}
          style={styles.button}
        />

        {/* bottom stat cards */}
        <View style={styles.statsRow}>
          <SmallMetricCard
            label="Streak"
            value={streak > 0 ? `${streak}d` : '—'}
          />
          <SmallMetricCard
            label="Last Fast"
            value={lastFastSec > 0 ? formatDuration(lastFastSec) : '—'}
          />
          <SmallMetricCard
            label="Avg/Week"
            value={weekAvgSec > 0 ? formatDuration(weekAvgSec) : '—'}
          />
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
