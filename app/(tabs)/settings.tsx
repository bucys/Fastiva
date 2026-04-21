import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SectionCard from '@/components/section-card';
import SettingsRow from '@/components/settings-row';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function SettingsScreen() {
  const [goalReached, setGoalReached] = useState(true);
  const [reminderStart, setReminderStart] = useState(false);
  const [reminderEnd, setReminderEnd] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SectionCard title="Fasting Goal">
          <SettingsRow
            label="Daily Goal"
            value="16h"
            onPress={() => Alert.alert('Daily Goal', 'Goal selection coming soon.')}
          />
          <SettingsRow
            label="Goal Presets"
            onPress={() => Alert.alert('Presets', '12:12 · 14:10 · 16:8 · 18:6 · 20:4')}
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
            toggleValue={goalReached}
            onToggleChange={setGoalReached}
          />
          <SettingsRow
            label="Reminder to Start"
            isToggle
            toggleValue={reminderStart}
            onToggleChange={setReminderStart}
          />
          <SettingsRow
            label="Reminder to End"
            isToggle
            toggleValue={reminderEnd}
            onToggleChange={setReminderEnd}
          />
        </SectionCard>

        <SectionCard title="General">
          <SettingsRow
            label="Dark Mode"
            isToggle
            toggleValue={darkMode}
            onToggleChange={setDarkMode}
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
