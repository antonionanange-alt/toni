import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const palette = {
  ink: '#172522',
  muted: '#71807A',
  green: '#123D36',
  greenDark: '#0B2B28',
  greenLight: '#E7F0EB',
  orange: '#D28A42',
  gold: '#E8B35D',
  canvas: '#F5F3EC',
  card: '#FFFEFB',
  border: '#E4E2D9',
  danger: '#B7463C',
  success: '#327A54',
};

export function MinexLogo({ size = 56 }: { size?: number }) {
  return (
    <View
      accessibilityLabel="Logo MINEX"
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          borderWidth: Math.max(1.5, size * 0.028),
        },
      ]}>
      <View style={[styles.logoInner, { borderRadius: size * 0.27 }]}>
        <Text style={[styles.logoLetter, { fontSize: size * 0.56, lineHeight: size * 0.64 }]}>M</Text>
      </View>
      <View
        style={[
          styles.logoSpark,
          {
            width: size * 0.15,
            height: size * 0.15,
            borderRadius: size * 0.075,
            top: size * 0.12,
            right: size * 0.1,
          },
        ]}
      />
    </View>
  );
}

export function Page({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#95A19B"
        style={[styles.input, props.multiline && styles.multiline, props.style]}
      />
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
  danger = false,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const backgroundColor = danger
    ? '#FCEDEA'
    : secondary
      ? palette.greenLight
      : palette.green;
  const color = danger ? palette.danger : secondary ? palette.green : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled ? 0.55 : pressed ? 0.82 : 1 },
      ]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonText, { color }]}>{label}</Text>}
    </Pressable>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyMark}>—</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  page: { padding: 20, paddingBottom: 36, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, gap: 5 },
  eyebrow: { color: palette.orange, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: palette.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: palette.ink,
    backgroundColor: '#FBFCFA',
    fontSize: 15,
  },
  multiline: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 14, fontWeight: '800' },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 22, gap: 7 },
  emptyMark: { color: palette.orange, fontSize: 26, fontWeight: '800' },
  emptyText: { color: palette.muted, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  logo: {
    backgroundColor: palette.greenDark,
    borderColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.greenDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },
  logoInner: {
    width: '78%',
    height: '78%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.green,
  },
  logoLetter: {
    color: '#FFFDF7',
    fontWeight: '900',
    letterSpacing: -2,
    marginTop: -2,
  },
  logoSpark: {
    position: 'absolute',
    backgroundColor: palette.orange,
    borderWidth: 2,
    borderColor: palette.greenDark,
  },
});
