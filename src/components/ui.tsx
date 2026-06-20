import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: ButtonProps) {
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
    outline: styles.outline,
  }[variant];

  const textStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    danger: styles.dangerText,
    outline: styles.outlineText,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={variant === 'outline' ? colors.primary : '#fff'}
          style={styles.icon}
        />
      )}
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.textSecondary} {...props} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  danger: { backgroundColor: colors.danger },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#fff' },
  dangerText: { color: '#fff' },
  outlineText: { color: colors.primary },
  icon: { marginRight: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
