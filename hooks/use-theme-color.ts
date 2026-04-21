import { Colors } from '@/constants/theme';

const legacyMap: Record<string, string> = {
  text: Colors.textPrimary,
  background: Colors.background,
  tint: Colors.primary,
  icon: Colors.textSecondary,
  tabIconDefault: Colors.textSecondary,
  tabIconSelected: Colors.primary,
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string,
): string {
  return props.dark ?? legacyMap[colorName] ?? Colors.textPrimary;
}
