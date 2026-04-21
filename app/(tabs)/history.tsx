import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from 'date-fns';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SegmentedControl from '@/components/segmented-control';
import HistoryListItem from '@/components/history-list-item';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_SESSIONS } from '@/utils/mock-data';
import { formatDuration, formatSessionDate, formatTime12 } from '@/utils/format';

const TODAY = new Date(2026, 3, 21);
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarView() {
  const monthStart = startOfMonth(TODAY);
  const monthEnd = endOfMonth(TODAY);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...days];

  const sessionDaySet = new Set(
    MOCK_SESSIONS.map((s) => format(s.endTime, 'yyyy-MM-dd')),
  );

  return (
    <View style={styles.calendarWrapper}>
      <Text style={styles.monthLabel}>{format(TODAY, 'MMMM yyyy')}</Text>
      <View style={styles.dayHeaders}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayHeader}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const key = format(date, 'yyyy-MM-dd');
          const hasFast = sessionDaySet.has(key);
          const isToday = isSameDay(date, TODAY);
          return (
            <View key={key} style={styles.cell}>
              <View
                style={[
                  styles.dayCell,
                  hasFast && styles.dayCellFast,
                  isToday && styles.dayCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    hasFast && styles.dayTextFast,
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <ScreenHeader title="History" />
      <SegmentedControl
        options={['Calendar', 'List']}
        selected={tab}
        onSelect={setTab}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 0 ? (
          <>
            <CalendarView />
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.listSection}>
          {tab === 0 && (
            <Text style={styles.sectionLabel}>Recent Sessions</Text>
          )}
          {MOCK_SESSIONS.map((session) => (
            <HistoryListItem
              key={session.id}
              date={formatSessionDate(session.endTime)}
              startTime={formatTime12(session.startTime)}
              endTime={formatTime12(session.endTime)}
              duration={formatDuration(session.durationSeconds)}
              goalReached={session.goalReached}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  calendarWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  monthLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellFast: {
    backgroundColor: `${Colors.primary}30`,
  },
  dayCellToday: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  dayTextFast: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  listSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
});
