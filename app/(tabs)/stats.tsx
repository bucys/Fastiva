import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SegmentedControl from '@/components/segmented-control';
import StatCard from '@/components/stat-card';
import BarChart from '@/components/bar-chart';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useFastingStore } from '@/store/fasting-store';
import { MOCK_SESSIONS, MOCK_MONTH_BARS, MOCK_YEAR_BARS } from '@/utils/mock-data';
import { formatDuration } from '@/utils/format';
import {
  computeStreak,
  computeMonthBars,
  computeWeekBars,
  computeYearBars,
  goalAchievementRate,
  longestFast,
  weeklyAverage,
} from '@/utils/stats';

const CHART_LABELS = ['Daily fasting hours', 'Weekly fasting hours', 'Monthly fasting hours'];

export default function StatsScreen() {
  const [tab, setTab] = useState(0);
  const { sessions: storedSessions } = useFastingStore();

  // Prefer real sessions; fall back to mock so the UI is never empty
  const sessions = storedSessions.length > 0 ? storedSessions : MOCK_SESSIONS;
  const usingMock = storedSessions.length === 0;

  const weekAvgSec = weeklyAverage(sessions);
  const longestSec = longestFast(sessions);
  const total = sessions.length;
  const goalRate = goalAchievementRate(sessions);
  const streak = computeStreak(sessions);

  // Only compute heavy chart data when needed
  const bars = useMemo(() => {
    if (tab === 0) return computeWeekBars(usingMock ? MOCK_SESSIONS : storedSessions);
    if (tab === 1) return computeMonthBars(usingMock ? MOCK_SESSIONS : storedSessions);
    return computeYearBars(usingMock ? MOCK_SESSIONS : storedSessions);
  }, [tab, storedSessions, usingMock]);

  // For empty real sessions fall back to readable mock bars
  const displayBars =
    bars.every((b) => b.value === 0) && usingMock
      ? tab === 1 ? MOCK_MONTH_BARS : tab === 2 ? MOCK_YEAR_BARS : bars
      : bars;

  return (
    <ScreenContainer>
      <ScreenHeader title="Stats" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <SegmentedControl
          options={['Week', 'Month', 'Year']}
          selected={tab}
          onSelect={setTab}
        />

        {/* 2×2 stat grid */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard
              label="Weekly Average"
              value={weekAvgSec > 0 ? formatDuration(weekAvgSec) : '—'}
            />
            <StatCard
              label="Longest Fast"
              value={longestSec > 0 ? formatDuration(longestSec) : '—'}
              accent
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard label="Total Fasts" value={String(total)} />
            <StatCard
              label="Goal Achieved"
              value={total > 0 ? `${goalRate}%` : '—'}
              accent
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard
              label="Current Streak"
              value={streak > 0 ? `${streak}d` : '—'}
            />
          </View>
        </View>

        {/* bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{CHART_LABELS[tab]}</Text>
          <BarChart data={displayBars} unit="h" />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chartCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  bottomPad: { height: Spacing.xxl },
});
