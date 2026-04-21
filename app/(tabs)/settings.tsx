import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SectionCard from '@/components/section-card';
import SettingsRow from '@/components/settings-row';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useFastingStore } from '@/store/fasting-store';

const GOAL_PRESETS = [12, 14, 16, 18, 20] as const;

export default function SettingsScreen() {
  const { goalHours, settings, setGoal, updateSetting } = useFastingStore();

  function showGoalPicker() {
    Alert.alert(
      'Fasting Goal',
      `Current goal: ${goalHours}h`,
      [
        ...GOAL_PRESETS.map((h) => ({
          text: `${h}h${h === goalHours ? ' ✓' : ''}`,
          onPress: () => setGoal(h),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SectionCard title="Fasting Goal">
          <SettingsRow
            label="Daily Goal"
            value={`${goalHours}h`}
            onPress={showGoalPicker}
          />
          <SettingsRow
            label="Goal Presets"
            value="12h – 20h"
            onPress={showGoalPicker}
          />
          <SettingsRow
            label="Custom Goal"
            onPress={() => Alert.alert('Custom Goal', 'Custom duration picker coming soon.')}
          />
        </SectionCard>

        <SectionCard title="Notifications">
          <SettingsRow
            label="Goal Reached"
            isToggle
            toggleValue={settings.goalReachedNotif}
            onToggleChange={(v) => updateSetting('goalReachedNotif', v)}
          />
          <SettingsRow
            label="Reminder to Start"
            isToggle
            toggleValue={settings.reminderStart}
            onToggleChange={(v) => updateSetting('reminderStart', v)}
          />
          <SettingsRow
            label="Reminder to End"
            isToggle
            toggleValue={settings.reminderEnd}
            onToggleChange={(v) => updateSetting('reminderEnd', v)}
          />
        </SectionCard>

        <SectionCard title="General">
          <SettingsRow
            label="Dark Mode"
            isToggle
            toggleValue={settings.darkMode}
            onToggleChange={(v) => updateSetting('darkMode', v)}
          />
          <SettingsRow
            label="Language"
            value="English"
            onPress={() => Alert.alert('Language', 'Language selection coming soon.')}
          />
          <SettingsRow
            label="Data Export"
            onPress={() => Alert.alert('Export', 'CSV export coming soon.')}
          />
          <SettingsRow
            label="About"
            value="v1.0.0"
            onPress={() => Alert.alert('Fastiva', 'Intermittent fasting tracker.\nVersion 1.0.0')}
          />
        </SectionCard>

        <Text style={styles.footer}>Fastiva · Built with care</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  footer: {
    textAlign: 'center',
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    opacity: 0.5,
  },
});
