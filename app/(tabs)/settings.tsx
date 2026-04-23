import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '@/components/screen-container';
import ScreenHeader from '@/components/screen-header';
import SectionCard from '@/components/section-card';
import PrimaryButton from '@/components/primary-button';
import SettingsRow from '@/components/settings-row';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { exportSessionsCsv, getCompletedSessions, shareExportedFile } from '@/services/export';
import { useFastingStore } from '@/store/fasting-store';
import { formatMinutes24 } from '@/utils/format';

const GOAL_PRESETS = [12, 14, 16, 18, 20] as const;
const PLAN_PRESETS = [
  { fastHours: 12, eatingHours: 12 },
  { fastHours: 14, eatingHours: 10 },
  { fastHours: 16, eatingHours: 8 },
  { fastHours: 18, eatingHours: 6 },
  { fastHours: 20, eatingHours: 4 },
] as const;
const MIN_GOAL_HOURS = 1;
const MAX_GOAL_HOURS = 168;
const LONG_FAST_CONFIRMATION_HOURS = 72;

function isPresetGoal(hours: number): boolean {
  return GOAL_PRESETS.includes(hours as (typeof GOAL_PRESETS)[number]);
}

function isPresetPlan(fastHours: number | null, eatingHours: number | null): boolean {
  return PLAN_PRESETS.some(
    (preset) => preset.fastHours === fastHours && preset.eatingHours === eatingHours,
  );
}

function formatPlanValue(fastHours: number | null, eatingHours: number | null): string {
  if (fastHours == null || eatingHours == null) return 'Off';
  return `${fastHours}/${eatingHours}`;
}

function buildWindowLabel(startMinutes: number | null, durationHours: number | null, fallback: string): string {
  if (startMinutes == null || durationHours == null) return fallback;
  const endMinutes = startMinutes + durationHours * 60;
  return `${formatMinutes24(startMinutes)} - ${formatMinutes24(endMinutes)}`;
}

function parseHourInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hours = Number(trimmed);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return null;

  return hours * 60;
}

export default function SettingsScreen() {
  const {
    activeFast,
    goalHours,
    sessions,
    settings,
    setGoal,
    setFastingPlan,
    setFastingStartMinutes,
    updateSetting,
    clearHistory,
  } = useFastingStore();

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [customGoalVisible, setCustomGoalVisible] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState(String(goalHours));

  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [customPlanVisible, setCustomPlanVisible] = useState(false);
  const [customPlanFastInput, setCustomPlanFastInput] = useState(
    String(settings.fastingPlanFastHours ?? 16),
  );
  const [customPlanEatInput, setCustomPlanEatInput] = useState(
    String(settings.fastingPlanEatingHours ?? 8),
  );

  const [startTimeModalVisible, setStartTimeModalVisible] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(
    settings.fastingStartMinutes != null ? String(Math.floor(settings.fastingStartMinutes / 60)) : '18',
  );
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const hasFastingPlan =
    settings.fastingPlanFastHours != null && settings.fastingPlanEatingHours != null;

  const fastingPlanLabel = formatPlanValue(
    settings.fastingPlanFastHours,
    settings.fastingPlanEatingHours,
  );
  const fastingStartLabel =
    settings.fastingStartMinutes != null
      ? formatMinutes24(settings.fastingStartMinutes)
      : 'Not set';
  const fastingWindowLabel =
    settings.fastingPlanFastHours != null
      ? buildWindowLabel(
          settings.fastingStartMinutes,
          settings.fastingPlanFastHours,
          'Set a fasting start time',
        )
      : 'Unavailable for goals over 24h';
  const eatingWindowLabel =
    settings.fastingPlanEatingHours != null && settings.fastingPlanFastHours != null
      ? buildWindowLabel(
          settings.fastingStartMinutes != null
            ? settings.fastingStartMinutes + settings.fastingPlanFastHours * 60
            : null,
          settings.fastingPlanEatingHours,
          'Set a fasting start time',
        )
      : 'Unavailable for goals over 24h';

  function closeGoalModal() {
    Keyboard.dismiss();
    setGoalModalVisible(false);
    setCustomGoalVisible(false);
  }

  function closePlanModal() {
    Keyboard.dismiss();
    setPlanModalVisible(false);
    setCustomPlanVisible(false);
  }

  function closeStartTimeModal() {
    Keyboard.dismiss();
    setStartTimeModalVisible(false);
  }

  function closePrivacyModal() {
    setPrivacyModalVisible(false);
  }

  function openGoalModal() {
    if (hasFastingPlan) {
      Alert.alert(
        'Daily Goal is set by your plan',
        'Turn Fasting Plan off if you want to change Daily Goal manually.',
      );
      return;
    }

    setCustomGoalInput(String(goalHours));
    setCustomGoalVisible(!isPresetGoal(goalHours));
    setGoalModalVisible(true);
  }

  function openPlanModal() {
    setCustomPlanFastInput(String(settings.fastingPlanFastHours ?? 16));
    setCustomPlanEatInput(String(settings.fastingPlanEatingHours ?? 8));
    setCustomPlanVisible(
      hasFastingPlan &&
        !isPresetPlan(settings.fastingPlanFastHours, settings.fastingPlanEatingHours),
    );
    setPlanModalVisible(true);
  }

  function openStartTimeModal() {
    setStartTimeInput(
      settings.fastingStartMinutes != null ? String(Math.floor(settings.fastingStartMinutes / 60)) : '18',
    );
    setStartTimeModalVisible(true);
  }

  async function applyGoalSelection(hours: number) {
    await setGoal(hours);
    closeGoalModal();
  }

  async function applyGoalSelectionToCurrentFast(hours: number) {
    await setGoal(hours, { applyToActiveFast: true });
    closeGoalModal();
  }

  async function applyGoalSelectionForNextFast(hours: number) {
    await setGoal(hours, { applyToActiveFast: false });
    closeGoalModal();
  }

  function confirmLongGoal(hours: number, onConfirm: () => void) {
    if (hours <= LONG_FAST_CONFIRMATION_HOURS) {
      onConfirm();
      return;
    }

    Alert.alert(
      'Long Fast Confirmation',
      `Are you sure you want to fast for ${hours} hours?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: onConfirm,
        },
      ],
    );
  }

  function confirmAndApplyGoal(hours: number) {
    if (hours === goalHours && !activeFast) {
      closeGoalModal();
      return;
    }

    if (activeFast && hours !== goalHours) {
      Alert.alert(
        'Apply new goal?',
        'You have an active fast in progress.\nDo you want to apply the new goal to the current fast, or only use it for the next fast?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Only for next fast',
            onPress: () => {
              confirmLongGoal(hours, () => {
                void applyGoalSelectionForNextFast(hours);
              });
            },
          },
          {
            text: 'Apply to current fast',
            onPress: () => {
              confirmLongGoal(hours, () => {
                void applyGoalSelectionToCurrentFast(hours);
              });
            },
          },
        ],
      );
      return;
    }

    confirmLongGoal(hours, () => {
      void applyGoalSelection(hours);
    });
  }

  function handleCustomGoalSave() {
    const parsed = Number(customGoalInput.trim());

    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      Alert.alert('Invalid Goal', 'Enter a whole number of hours.');
      return;
    }

    if (parsed < MIN_GOAL_HOURS || parsed > MAX_GOAL_HOURS) {
      Alert.alert('Invalid Goal', `Choose a goal between ${MIN_GOAL_HOURS}h and ${MAX_GOAL_HOURS}h.`);
      return;
    }

    confirmAndApplyGoal(parsed);
  }

  async function handlePlanSelect(fastHours: number | null, eatingHours: number | null) {
    if (fastHours == null || eatingHours == null) {
      await setFastingPlan(null, null);
      closePlanModal();
      return;
    }

    if (activeFast && fastHours !== activeFast.goalHours) {
      Alert.alert(
        'Apply new goal?',
        'You have an active fast in progress.\nDo you want to apply the new goal to the current fast, or only use it for the next fast?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Only for next fast',
            onPress: () => {
              void (async () => {
                await setFastingPlan(fastHours, eatingHours);
                await setGoal(fastHours, { applyToActiveFast: false });
                closePlanModal();
              })();
            },
          },
          {
            text: 'Apply to current fast',
            onPress: () => {
              void (async () => {
                await setFastingPlan(fastHours, eatingHours);
                await setGoal(fastHours, { applyToActiveFast: true });
                closePlanModal();
              })();
            },
          },
        ],
      );
      return;
    }

    await setFastingPlan(fastHours, eatingHours);
    await setGoal(fastHours, { applyToActiveFast: false });
    closePlanModal();
  }

  async function handleCustomPlanSave() {
    const fastHours = Number(customPlanFastInput.trim());
    const eatingHours = Number(customPlanEatInput.trim());

    if (
      !Number.isFinite(fastHours) ||
      !Number.isFinite(eatingHours) ||
      !Number.isInteger(fastHours) ||
      !Number.isInteger(eatingHours)
    ) {
      Alert.alert('Invalid Plan', 'Enter whole hours for both fasting and eating windows.');
      return;
    }

    if (fastHours < 1 || eatingHours < 1) {
      Alert.alert('Invalid Plan', 'Fasting and eating windows must both be at least 1 hour.');
      return;
    }

    if (fastHours + eatingHours !== 24) {
      Alert.alert('Invalid Plan', 'Custom plans must add up to 24 hours.');
      return;
    }

    await handlePlanSelect(fastHours, eatingHours);
  }

  async function handleStartTimeSave() {
    const parsed = parseHourInput(startTimeInput);
    if (parsed == null) {
      Alert.alert('Invalid Time', 'Enter hour between 0–23.');
      return;
    }

    await setFastingStartMinutes(parsed);
    closeStartTimeModal();
  }

  async function handleExport() {
    const completedSessions = getCompletedSessions(sessions);

    if (!completedSessions.length) {
      Alert.alert('No Sessions Yet', 'No completed fasting sessions to export yet.');
      return;
    }

    try {
      setIsExporting(true);
      const fileUri = await exportSessionsCsv(completedSessions);
      const shared = await shareExportedFile(fileUri);

      if (!shared) {
        Alert.alert(
          'Export Ready',
          `CSV created successfully. Sharing is unavailable on this device.\n\nFile URI:\n${fileUri}`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_COMPLETED_SESSIONS') {
        Alert.alert('No Sessions Yet', 'No completed fasting sessions to export yet.');
        return;
      }

      Alert.alert(
        'Export Failed',
        'Unable to create the CSV export right now. Please try again in a moment.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  function handleClearHistory() {
    if (!sessions.length) {
      Alert.alert('No History', 'There are no fasting sessions to clear.');
      return;
    }

    Alert.alert(
      'Clear All History',
      'This will permanently remove all completed fasting sessions. Your active fast will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ],
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SectionCard title="Fasting Goal">
          <SettingsRow label="Daily Goal" value={`${goalHours}h`} onPress={openGoalModal} />
        </SectionCard>

        <SectionCard title="Fasting Plan">
          <SettingsRow label="Plan" value={fastingPlanLabel} onPress={openPlanModal} />
          {hasFastingPlan ? (
            <>
              <SettingsRow label="Fasting Starts" value={fastingStartLabel} onPress={openStartTimeModal} />
              <SettingsRow label="Fasting Window" value={fastingWindowLabel} showChevron={false} />
              <SettingsRow label="Eating Window" value={eatingWindowLabel} showChevron={false} />
            </>
          ) : null}
        </SectionCard>

        <SectionCard title="Notifications">
          <SettingsRow
            label="Goal Reached"
            isToggle
            toggleValue={settings.goalReachedNotif}
            onToggleChange={(value) => updateSetting('goalReachedNotif', value)}
          />
          {hasFastingPlan ? (
            <SettingsRow
              label="Fasting Start Reminder"
              isToggle
              toggleValue={settings.reminderStart}
              onToggleChange={(value) => updateSetting('reminderStart', value)}
            />
          ) : null}
        </SectionCard>

        <SectionCard title="General">
          <SettingsRow label="Language" value="English" showChevron={false} />
          <SettingsRow label="Data Export" value={isExporting ? 'Preparing...' : undefined} onPress={handleExport} />
          <SettingsRow label="Privacy" onPress={() => setPrivacyModalVisible(true)} />
          <SettingsRow label="About" value="v1.0.0" onPress={() => Alert.alert('Fastiva', 'Intermittent fasting tracker.\nVersion 1.0.0')} />
        </SectionCard>

        <SectionCard title="Danger Zone">
          <SettingsRow
            label="Clear All History"
            onPress={handleClearHistory}
            value={sessions.length > 0 ? `${sessions.length} saved` : undefined}
            danger
          />
        </SectionCard>

        <Text style={styles.footer}>Fastiva · Built with care</Text>
      </ScrollView>

      <Modal visible={goalModalVisible} transparent animationType="fade" onRequestClose={closeGoalModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? Spacing.lg : 0}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => Keyboard.dismiss()} />
          <View style={styles.modalSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={styles.goalModalScrollContent}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Daily Goal</Text>
                <Text style={styles.modalSubtitle}>Choose your fasting goal in hours.</Text>

                <View style={styles.goalOptions}>
                  {GOAL_PRESETS.map((hours) => {
                    const selected = goalHours === hours;
                    return (
                      <TouchableOpacity
                        key={hours}
                        style={[styles.goalOption, selected && styles.goalOptionSelected]}
                        activeOpacity={0.8}
                        onPress={() => confirmAndApplyGoal(hours)}
                      >
                        <Text style={[styles.goalOptionText, selected && styles.goalOptionTextSelected]}>
                          {hours}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.goalOption, customGoalVisible && styles.goalOptionSelected]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCustomGoalInput(String(goalHours));
                      setCustomGoalVisible(true);
                    }}
                  >
                    <Text style={[styles.goalOptionText, customGoalVisible && styles.goalOptionTextSelected]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {customGoalVisible ? (
                  <View style={styles.customGoalCard}>
                    <Text style={styles.customGoalLabel}>Custom Goal</Text>
                    <TextInput
                      value={customGoalInput}
                      onChangeText={setCustomGoalInput}
                      keyboardType="number-pad"
                      placeholder="Hours"
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.customGoalInput}
                      maxLength={3}
                      returnKeyType="done"
                      onSubmitEditing={handleCustomGoalSave}
                    />
                    <Text style={styles.customGoalHint}>
                      Enter a whole number between {MIN_GOAL_HOURS} and {MAX_GOAL_HOURS}. Goals over {LONG_FAST_CONFIRMATION_HOURS}h require confirmation.
                    </Text>
                    <PrimaryButton label="Save Custom Goal" onPress={handleCustomGoalSave} style={styles.customGoalButton} />
                  </View>
                ) : null}

                <TouchableOpacity style={styles.modalCloseButton} activeOpacity={0.8} onPress={closeGoalModal}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={planModalVisible} transparent animationType="fade" onRequestClose={closePlanModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? Spacing.lg : 0}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => Keyboard.dismiss()} />
          <View style={styles.modalSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={styles.goalModalScrollContent}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Fasting Plan</Text>
                <Text style={styles.modalSubtitle}>Choose an optional fasting schedule. When a plan is active, Daily Goal matches its fasting hours.</Text>

                <View style={styles.goalOptions}>
                  <TouchableOpacity
                    style={[styles.goalOption, !hasFastingPlan && styles.goalOptionSelected]}
                    activeOpacity={0.8}
                    onPress={() => handlePlanSelect(null, null)}
                  >
                    <Text style={[styles.goalOptionText, !hasFastingPlan && styles.goalOptionTextSelected]}>
                      Off
                    </Text>
                  </TouchableOpacity>
                  {PLAN_PRESETS.map((plan) => {
                    const selected =
                      settings.fastingPlanFastHours === plan.fastHours &&
                      settings.fastingPlanEatingHours === plan.eatingHours;
                    return (
                      <TouchableOpacity
                        key={`${plan.fastHours}/${plan.eatingHours}`}
                        style={[styles.goalOption, selected && styles.goalOptionSelected]}
                        activeOpacity={0.8}
                        onPress={() => handlePlanSelect(plan.fastHours, plan.eatingHours)}
                      >
                        <Text style={[styles.goalOptionText, selected && styles.goalOptionTextSelected]}>
                          {plan.fastHours}/{plan.eatingHours}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.goalOption, customPlanVisible && styles.goalOptionSelected]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCustomPlanFastInput(String(settings.fastingPlanFastHours ?? 16));
                      setCustomPlanEatInput(String(settings.fastingPlanEatingHours ?? 8));
                      setCustomPlanVisible(true);
                    }}
                  >
                    <Text style={[styles.goalOptionText, customPlanVisible && styles.goalOptionTextSelected]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {customPlanVisible ? (
                  <View style={styles.customGoalCard}>
                    <Text style={styles.customGoalLabel}>Custom Plan</Text>
                    <View style={styles.planInputsRow}>
                      <View style={styles.planInputGroup}>
                        <Text style={styles.planInputLabel}>Fast</Text>
                        <TextInput
                          value={customPlanFastInput}
                          onChangeText={setCustomPlanFastInput}
                          keyboardType="number-pad"
                          placeholder="16"
                          placeholderTextColor={Colors.textSecondary}
                          style={styles.planInput}
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.planInputGroup}>
                        <Text style={styles.planInputLabel}>Eat</Text>
                        <TextInput
                          value={customPlanEatInput}
                          onChangeText={setCustomPlanEatInput}
                          keyboardType="number-pad"
                          placeholder="8"
                          placeholderTextColor={Colors.textSecondary}
                          style={styles.planInput}
                          maxLength={2}
                        />
                      </View>
                    </View>
                    <Text style={styles.customGoalHint}>Custom fasting plans must total 24 hours.</Text>
                    <PrimaryButton label="Save Custom Plan" onPress={handleCustomPlanSave} style={styles.customGoalButton} />
                  </View>
                ) : null}

                <TouchableOpacity style={styles.modalCloseButton} activeOpacity={0.8} onPress={closePlanModal}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={startTimeModalVisible} transparent animationType="fade" onRequestClose={closeStartTimeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? Spacing.lg : 0}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => Keyboard.dismiss()} />
          <View style={styles.modalSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={styles.goalModalScrollContent}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Fasting Start Time</Text>
                <Text style={styles.modalSubtitle}>Enter the hour your fasting window should begin.</Text>

                <View style={styles.customGoalCard}>
                  <Text style={styles.customGoalLabel}>Start Time</Text>
                  <TextInput
                    value={startTimeInput}
                    onChangeText={setStartTimeInput}
                    keyboardType="number-pad"
                    placeholder="18"
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.customGoalInput}
                    maxLength={2}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleStartTimeSave}
                  />
                  <Text style={styles.customGoalHint}>Enter an hour from 0 to 23. Fastiva will save it as HH:00.</Text>
                  <PrimaryButton label="Save Start Time" onPress={handleStartTimeSave} style={styles.customGoalButton} />
                </View>

                <TouchableOpacity style={styles.modalCloseButton} activeOpacity={0.8} onPress={closeStartTimeModal}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={privacyModalVisible} transparent animationType="fade" onRequestClose={closePrivacyModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closePrivacyModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Privacy</Text>
              <Text style={styles.privacyBody}>Fastiva stores fasting data locally on your device.</Text>
              <Text style={styles.privacyBody}>We do not collect personal information.</Text>
              <Text style={styles.privacyBody}>We do not track usage.</Text>
              <Text style={styles.privacyBody}>We do not share data with third parties.</Text>
              <Text style={styles.privacyBody}>
                All data remains on your device unless you export it manually.
              </Text>

              <TouchableOpacity style={styles.modalCloseButton} activeOpacity={0.8} onPress={closePrivacyModal}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    maxHeight: '88%',
  },
  modalScrollContent: {
    paddingTop: Spacing.lg,
  },
  goalModalScrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  goalOptions: {
    gap: Spacing.sm,
  },
  goalOption: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.cardSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  goalOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124,58,237,0.16)',
  },
  goalOptionText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  goalOptionTextSelected: {
    color: Colors.accent,
  },
  customGoalCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cardSecondary,
    gap: Spacing.sm,
  },
  customGoalLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  customGoalInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  customGoalButton: {
    alignSelf: 'stretch',
  },
  customGoalHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  privacyBody: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  planInputsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  planInputGroup: {
    flex: 1,
    gap: Spacing.xs,
  },
  planInputLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modalCloseButton: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  modalCloseText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});
