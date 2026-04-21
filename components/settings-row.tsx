import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface Props {
  label: string;
  value?: string;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (val: boolean) => void;
  onPress?: () => void;
}

export default function SettingsRow({
  label,
  value,
  isToggle = false,
  toggleValue = false,
  onToggleChange,
  onPress,
}: Props) {
  const content = (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: Colors.cardSecondary, true: Colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={Colors.cardSecondary}
        />
      ) : (
        <View style={styles.right}>
          {value ? <Text style={styles.value}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </View>
      )}
    </View>
  );

  if (isToggle) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  label: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.regular,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  value: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
});
