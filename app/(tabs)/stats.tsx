import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SegmentedControl from '@/components/segmented-control';
import StatCard from '@/components/stat-card';
import BarChart from '@/components/bar-chart';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_SESSIONS, MOCK_WEEK_BARS, MOCK_MONTH_BARS, MOCK_YEAR_BARS } from '@/utils/mock-data';
import { formatDuration } from '@/utils/format';

const totalFasts = MOCK_SESSIONS.length;
const goalAchieved = MOCK_SESSIONS.filter((s) => s.goalReached).length;
const goalRate = Math.round((goalAchieved / totalFasts) * 100);
const longestSeconds = Math.max(...MOCK_SESSIONS.map((s) => s.durationSeconds));

const sevenDays = MOCK_SESSIONS.slice(0, 4);
const weeklyAvgSeconds = Math.round(
  sevenDays.reduce((sum, s) => sum + s.durationSeconds, 0) / sevenDays.length,
);

const BAR_TABS = [
  { bars: MOCK_WEEK_BARS, unit: 'h', label: 'Daily fasting hours' },
  { bars: MOCK_MONTH_BARS, unit: 'h', label: 'Weekly fasting hours' },
  { bars: MOCK_YEAR_BARS, unit: 'h', label: 'Monthly fasting hours' },
];

export default function StatsScreen() {
  const [tab, setTab] = useState(0);
  const { bars, unit, label } = BAR_TABS[tab];

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
            <StatCard label="Weekly Average" value={formatDuration(weeklyAvgSeconds)} />
            <StatCard label="Longest Fast" value={formatDuration(longestSeconds)} accent />
          </View>
          <View style={styles.gridRow}>
            <StatCard label="Total Fasts" value={String(totalFasts)} />
            <StatCard label="Goal Achieved" value={`${goalRate}%`} accent />
          </View>
        </View>

        {/* bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{label}</Text>
          <BarChart data={bars} unit={unit} />
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
