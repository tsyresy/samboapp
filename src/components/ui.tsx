import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import type { ComponentProps, ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { colors, gradient, radius } from '@/lib/theme'

export type IconName = ComponentProps<typeof Ionicons>['name']

/** The SAMBO dark green gradient, behind every screen. */
export function Backdrop({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[{ flex: 1 }, style]}>
      {/* Soft green glow top-left and gold glow bottom-right, like the site. */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="green" cx="8%" cy="0%" rx="70%" ry="45%" fx="8%" fy="0%">
            <Stop offset="0" stopColor="#2f8c5a" stopOpacity="0.42" />
            <Stop offset="1" stopColor="#2f8c5a" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gold" cx="100%" cy="100%" rx="60%" ry="40%" fx="100%" fy="100%">
            <Stop offset="0" stopColor="#c8a03c" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#c8a03c" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#green)" />
        <Rect width="100%" height="100%" fill="url(#gold)" />
      </Svg>
      {children}
    </LinearGradient>
  )
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>
}

export function Subtitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  )
}

/** Glass panel. `tone="danger"` for amounts owed. */
export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  tone?: 'default' | 'danger' | 'accent'
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'danger' && { backgroundColor: colors.dangerBg, borderColor: colors.dangerLine },
        tone === 'accent' && { backgroundColor: 'rgba(116,224,161,0.10)', borderColor: 'rgba(116,224,161,0.28)' },
        style,
      ]}
    >
      {children}
    </View>
  )
}

/** A card that responds to touch (dims slightly while pressed). */
export function PressableCard({
  children,
  style,
  tone,
  ...props
}: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'default' | 'danger' | 'accent' }) {
  return (
    <Pressable {...props} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <Card style={style} tone={tone}>
        {children}
      </Card>
    </Pressable>
  )
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'glass' | 'danger'
  icon?: IconName
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  small?: boolean
}) {
  const fg = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.ink
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && { backgroundColor: colors.accentStrong },
        variant === 'glass' && { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: colors.line },
        variant === 'danger' && { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerLine },
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 15 : 18} color={fg} />}
          <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.ink,
  size = 22,
}: {
  icon: IconName
  onPress: () => void
  label: string
  color?: string
  size?: number
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  )
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor={colors.inkSubtle} selectionColor={colors.accent} style={[styles.field, style]} {...props} />
    </View>
  )
}

export function Avatar({
  name,
  photoUrl,
  size = 44,
  online,
  rounded = 'full',
}: {
  name: string
  photoUrl: string | null | undefined
  size?: number
  online?: boolean
  rounded?: 'full' | 'md'
}) {
  const r = rounded === 'full' ? size / 2 : 14
  return (
    <View style={{ width: size, height: size }}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: r }} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: r }]}>
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: size * 0.4 }}>{name.charAt(0).toUpperCase() || '?'}</Text>
        </View>
      )}
      {online !== undefined && (
        <View
          style={[
            styles.presenceDot,
            { width: size * 0.3, height: size * 0.3, borderRadius: size, backgroundColor: online ? colors.online : colors.offline },
          ]}
        />
      )}
    </View>
  )
}

export function Pill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' | 'danger' | 'gold' }) {
  const palette = {
    default: { bg: 'rgba(255,255,255,0.10)', fg: colors.inkMuted },
    accent: { bg: 'rgba(116,224,161,0.15)', fg: colors.accent },
    danger: { bg: 'rgba(239,68,68,0.16)', fg: colors.danger },
    gold: { bg: 'rgba(230,188,61,0.18)', fg: colors.gold },
  }[tone]
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  )
}

/** Unread counter. `inverted` for use on an accent-coloured background. */
export function Badge({ count, inverted }: { count: number; inverted?: boolean }) {
  if (!count) return null
  return (
    <View style={[styles.badge, inverted && { backgroundColor: colors.onAccent }]}>
      <Text style={[styles.badgeText, inverted && { color: colors.accent }]}>{count > 99 ? '99+' : count}</Text>
    </View>
  )
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
      <Text style={[styles.subtitle, { marginTop: 10 }]}>{label}</Text>
    </View>
  )
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={[styles.center, { paddingVertical: 40 }]}>
      <Ionicons name={icon} size={36} color={colors.inkSubtle} />
      <Text style={[styles.sectionTitle, { marginTop: 10, textAlign: 'center' }]}>{title}</Text>
      {text && <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 4 }]}>{text}</Text>}
    </View>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <Text style={{ color: colors.danger, fontSize: 14 }}>{children}</Text>
}

export const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: colors.inkMuted, fontSize: 14, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '600' },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.lg,
    padding: 16,
  },
  button: {
    minHeight: 46,
    borderRadius: radius.full,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { minHeight: 36, paddingHorizontal: 14 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.ink, fontSize: 14, fontWeight: '500' },
  field: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  presenceDot: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: colors.canvas },
  pill: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onAccent, fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
})
