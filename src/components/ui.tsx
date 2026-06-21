import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme';

/* ── BUTTON ────────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize   = 'md' | 'sm' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: ButtonSize;
  full?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  disabled,
  loading,
  style,
  size = 'md',
  full,
}: ButtonProps) {
  const bg: Record<ButtonVariant, string> = {
    primary:   colors.primary,
    secondary: colors.primaryLight,
    outline:   'transparent',
    ghost:     colors.primaryMuted,
    danger:    colors.danger,
  };

  const txtColor: Record<ButtonVariant, string> = {
    primary:   '#fff',
    secondary: '#fff',
    outline:   colors.primary,
    ghost:     colors.primary,
    danger:    '#fff',
  };

  const iconColor = txtColor[variant];

  const heights: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 54 };
  const fontSizes: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 16 };
  const hPad: Record<ButtonSize, number> = { sm: 14, md: 20, lg: 24 };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        btn.base,
        {
          backgroundColor: bg[variant],
          height: heights[size],
          paddingHorizontal: hPad[size],
          borderRadius: radius.md,
          ...(variant === 'outline' && { borderWidth: 1.5, borderColor: colors.primary }),
          ...(full && { width: '100%' }),
          opacity: pressed ? 0.82 : 1,
          ...(disabled && { opacity: 0.4 }),
          ...(variant === 'primary' && shadow.sm),
          ...(variant === 'secondary' && shadow.sm),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={iconColor} />}
          <Text style={[btn.text, { fontSize: fontSizes[size], color: txtColor[variant] }]}>
            {title}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={size === 'sm' ? 14 : 16} color={iconColor} />}
        </>
      )}
    </Pressable>
  );
}

const btn = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

/* ── INPUT ─────────────────────────────────────────────────────────────── */

export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      style={[inp.base, style]}
      placeholderTextColor={colors.textTertiary}
      {...props}
    />
  );
}

const inp = StyleSheet.create({
  base: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
});

/* ── CARD ──────────────────────────────────────────────────────────────── */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[card.base, style]}>{children}</View>;
}

const card = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
});

/* ── SECTION HEADER ─────────────────────────────────────────────────────── */

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.text}>
        <Text style={sh.title}>{title}</Text>
        {subtitle ? <Text style={sh.sub}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const sh = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  text:  { flex: 1, gap: 2 },
  title: { ...typography.heading, color: colors.text },
  sub:   { ...typography.caption, color: colors.textSecondary },
});

/* ── EMPTY STATE ────────────────────────────────────────────────────────── */

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
    <View style={es.wrap}>
      <View style={es.icon}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={es.title}>{title}</Text>
      <Text style={es.msg}>{message}</Text>
    </View>
  );
}

const es = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  icon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { ...typography.heading, color: colors.text, textAlign: 'center' },
  msg:   { ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});

/* ── BADGE ─────────────────────────────────────────────────────────────── */

export function Badge({
  label,
  color,
  bg,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[bdg.wrap, bg ? { backgroundColor: bg } : {}]}>
      <Text style={[bdg.text, color ? { color } : {}]}>{label}</Text>
    </View>
  );
}

const bdg = StyleSheet.create({
  wrap: { backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: radius.full },
  text: { ...typography.micro, color: colors.primary, textTransform: 'uppercase' },
});

/* ── ROW ITEM ───────────────────────────────────────────────────────────── */

export function RowItem({
  icon,
  iconBg,
  title,
  subtitle,
  right,
  onPress,
  chevron = true,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [ri.wrap, pressed && { opacity: 0.7 }]}
    >
      {icon && (
        <View style={[ri.iconBox, iconBg ? { backgroundColor: iconBg } : {}]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      )}
      <View style={ri.info}>
        <Text style={ri.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={ri.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ?? (chevron && onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null)}
    </Pressable>
  );
}

const ri = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  iconBox: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  info:    { flex: 1 },
  title:   { ...typography.label, color: colors.text, fontWeight: '600' },
  sub:     { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

/* ── STAT CARD ──────────────────────────────────────────────────────────── */

export function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  accent?: string;
}) {
  const c = accent ?? colors.primary;
  return (
    <View style={[sc.wrap, { borderTopColor: c, borderTopWidth: 3 }]}>
      <Ionicons name={icon} size={18} color={c} />
      <Text style={[sc.value, { color: c }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  value: { fontSize: 22, fontWeight: '800' },
  label: { ...typography.micro, color: colors.textSecondary, textTransform: 'uppercase' },
});
