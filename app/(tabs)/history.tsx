import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SegmentedControl from '@/components/segmented-control';
import HistoryListItem from '@/components/history-list-item';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useFastingStore } from '@/store/fasting-store';
import { formatDuration, formatSessionDate, formatTime24 } from '@/utils/format';
import { FastingSession } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { getSessionCompletionPercent, getSessionStatus } from '@/utils/stats';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface CalendarViewProps {
  sessions: FastingSession[];
  visibleMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

interface DayDetailsProps {
  sessions: FastingSession[];
  selectedDate: Date;
}

function getSessionsForDay(sessions: FastingSession[], date: Date): FastingSession[] {
  return sessions.filter((session) => isSameDay(new Date(session.endTime), date));
}

function getLongestSessionForDay(sessions: FastingSession[], date: Date): FastingSession | null {
  const daySessions = getSessionsForDay(sessions, date);
  if (!daySessions.length) return null;

  return daySessions.reduce((longest, session) =>
    session.durationSeconds > longest.durationSeconds ? session : longest,
  );
}

function formatCalendarDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `${hours}h`;

  const minutes = Math.max(1, Math.floor(seconds / 60));
  return `${minutes}m`;
}

function CalendarView({ sessions, visibleMonth, selectedDate, onSelectDate }: CalendarViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (getDay(monthStart) + 6) % 7;
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...days];

  return (
    <View style={styles.calendarWrapper}>
      <View style={styles.dayHeaders}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const key = format(date, 'yyyy-MM-dd');
          const longestSession = getLongestSessionForDay(sessions, date);
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const isInMonth = isSameMonth(date, visibleMonth);
          const goalReached = longestSession ? getSessionCompletionPercent(longestSession) >= 100 : false;
          return (
            <TouchableOpacity
              key={key}
              style={styles.cell}
              activeOpacity={0.8}
              onPress={() => onSelectDate(date)}
            >
              <View style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
                goalReached && styles.dayCellGoalReached,
                !isInMonth && styles.dayCellOutsideMonth,
              ]}>
                <Text style={[
                  styles.dayText,
                  isToday && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}>
                  {date.getDate()}
                </Text>
                {longestSession ? (
                  <Text
                    style={[
                      styles.dayDurationText,
                      isSelected && styles.dayDurationTextSelected,
                      goalReached && styles.dayDurationTextGoalReached,
                    ]}
                  >
                    {formatCalendarDuration(longestSession.durationSeconds)}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DayDetails({ sessions, selectedDate }: DayDetailsProps) {
  if (!sessions.length) {
    return (
      <View style={styles.detailsCard}>
        <Text style={styles.detailsEmpty}>No fasting sessions yet</Text>
      </View>
    );
  }

  const session = getLongestSessionForDay(sessions, selectedDate);
  if (!session) {
    return (
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
        <Text style={styles.detailsEmpty}>No fasting session logged</Text>
      </View>
    );
  }

  const completionPercent = getSessionCompletionPercent(session);
  const status = getSessionStatus(session);
  const statusColor =
    status === 'Goal met'
      ? Colors.success
      : status === 'Partial'
      ? Colors.warning
      : '#EF4444';

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.detailsTitle}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
      <View style={styles.detailsList}>
        <View style={styles.sessionCard}>
          <View style={styles.sessionTopRow}>
            <Text style={styles.sessionDuration}>{formatDuration(session.durationSeconds)}</Text>
            <Text style={[styles.sessionStatus, { color: statusColor }]}>{status}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Start time</Text>
            <Text style={styles.detailsValue}>{formatTime24(session.startTime)}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>End time</Text>
            <Text style={styles.detailsValue}>{formatTime24(session.endTime)}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Completion vs goal</Text>
            <Text style={styles.detailsValue}>{completionPercent}% of {session.goalHours}h</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [tab, setTab] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const { sessions, deleteSession } = useFastingStore();
  const currentMonth = startOfMonth(new Date());
  const recentSessions = sessions.slice(0, 5);
  const canGoForward = !isSameMonth(visibleMonth, currentMonth);

  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      setVisibleMonth(startOfMonth(today));
      setSelectedDate(today);
    }, []),
  );

  function confirmDelete(session: FastingSession) {
    Alert.alert(
      'Delete Session',
      `Remove the fasting session from ${formatSessionDate(session.endTime)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ],
    );
  }

  function handlePreviousMonth() {
    const nextMonth = subMonths(visibleMonth, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(startOfMonth(nextMonth));
  }

  function handleNextMonth() {
    if (!canGoForward) return;
    const nextMonth = addMonths(visibleMonth, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(startOfMonth(nextMonth));
  }

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
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.monthArrow} onPress={handlePreviousMonth} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{format(visibleMonth, 'MMMM yyyy')}</Text>
              <TouchableOpacity
                style={[styles.monthArrow, !canGoForward && styles.monthArrowDisabled]}
                onPress={handleNextMonth}
                activeOpacity={canGoForward ? 0.8 : 1}
                disabled={!canGoForward}
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <CalendarView
              sessions={sessions}
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <View style={styles.detailsSection}>
              <DayDetails sessions={sessions} selectedDate={selectedDate} />
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.listSection}>
          {tab === 0 && (
            <Text style={styles.sectionLabel}>Recent Sessions</Text>
          )}
          {(tab === 0 ? recentSessions.length === 0 : sessions.length === 0) ? (
            <Text style={styles.emptyText}>
              No fasting sessions yet. Start your first fast!
            </Text>
          ) : (
            (tab === 0 ? recentSessions : sessions).map((session) => (
              <HistoryListItem
                key={session.id}
                date={formatSessionDate(session.endTime)}
                startTime={formatTime24(session.startTime)}
                endTime={formatTime24(session.endTime)}
                duration={formatDuration(session.durationSeconds)}
                status={getSessionStatus(session)}
                onDelete={() => confirmDelete(session)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  calendarWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  monthNav: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: {
    opacity: 0.35,
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
    height: 38,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 3,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellGoalReached: {
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.65)',
  },
  dayCellOutsideMonth: {
    opacity: 0.55,
  },
  dayText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  dayTextToday: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
  },
  dayDurationText: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    lineHeight: 11,
    marginTop: 1,
  },
  dayDurationTextSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  dayDurationTextGoalReached: {
    color: '#86EFAC',
  },
  detailsSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  detailsList: {
    gap: Spacing.sm,
  },
  detailsTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  detailsLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailsValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  sessionCard: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sessionDuration: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  sessionStatus: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  detailsEmpty: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
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
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 24,
  },
});
