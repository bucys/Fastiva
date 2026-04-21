import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SegmentedControl from '@/components/segmented-control';
import StatCard from '@/components/stat-card';
import BarChart from '@/components/bar-chart';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useFastingStore } from '@/store/fasting-store';
import { formatDuration } from '@/utils/format';
import {
  averageDurationForPeriod,
  computeStreak,
  computeMonthBars,
  computeWeekBars,
  computeYearBars,
  goalAchievementRateForPeriod,
  longestFastForPeriod,
  StatsPeriod,
  totalDurationForPeriod,
  totalFastsForPeriod,
} from '@/utils/stats';

const CHART_LABELS = ['Daily fasting hours', 'Weekly fasting hours', 'Monthly fasting hours'];
const PERIODS: StatsPeriod[] = ['week', 'month', 'year'];
const PERIOD_AVERAGE_LABELS: Record<StatsPeriod, string> = {
  week: 'Weekly Average',
  month: 'Monthly Average',
  year: 'Yearly Average',
};

export default function StatsScreen() {
  const [tab, setTab] = useState(0);
  const { sessions } = useFastingStore();
  const selectedPeriod = PERIODS[tab];

  const averageSec = averageDurationForPeriod(sessions, selectedPeriod);
  const totalDurationSec = totalDurationForPeriod(sessions, selectedPeriod);
  const longestSec = longestFastForPeriod(sessions, selectedPeriod);
  const total = totalFastsForPeriod(sessions, selectedPeriod);
  const goalRate = goalAchievementRateForPeriod(sessions, selectedPeriod);
  const streak = computeStreak(sessions);

  // Only compute heavy chart data when needed
  const bars = useMemo(() => {
    if (tab === 0) return computeWeekBars(sessions);
    if (tab === 1) return computeMonthBars(sessions);
    return computeYearBars(sessions);
  }, [tab, sessions]);

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
              label={PERIOD_AVERAGE_LABELS[selectedPeriod]}
              value={averageSec > 0 ? formatDuration(averageSec) : '—'}
            />
            <StatCard
              label="Longest Fast"
              value={longestSec > 0 ? formatDuration(longestSec) : '—'}
              accent
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard
              label="Total Fasting Time"
              value={totalDurationSec > 0 ? formatDuration(totalDurationSec) : '—'}
            />
            <StatCard
              label="Total Fasts"
              value={String(total)}
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard
              label="Overall Streak"
              value={streak > 0 ? `${streak}d` : '—'}
            />
            <StatCard
              label="Goal Achieved"
              value={`${goalRate}%`}
              accent
            />
          </View>
        </View>

        {/* bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{CHART_LABELS[tab]}</Text>
          <BarChart data={bars} />
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
