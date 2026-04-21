import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger';
  style?: ViewStyle;
}

export default function PrimaryButton({ label, onPress, variant = 'primary', style }: Props) {
  const bg = variant === 'danger' ? '#EF4444' : Colors.primary;
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bg }, style]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  label: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
