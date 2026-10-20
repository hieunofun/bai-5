import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts, palette } from '@/constants/course-theme';
import { useCourses } from '@/providers/course-provider';

export type IconName = ComponentProps<typeof Feather>['name'];
type Weight = keyof typeof fonts;

export function AppText({
  weight = 'regular',
  style,
  ...props
}: TextProps & { weight?: Weight }) {
  return (
    <Text
      {...props}
      style={[styles.text, { fontFamily: fonts[weight] }, style]}
    />
  );
}

export function Icon({
  name,
  size = 20,
  color = palette.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}

export function Button({
  title,
  onPress,
  variant = 'outline',
  icon,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color =
    variant === 'primary'
      ? palette.onPrimary
      : variant === 'danger'
        ? palette.danger
        : palette.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled}
      onPress={() => {
        if (!loading) onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <View style={[styles.buttonContent, loading && { opacity: 0 }]}>
        {icon ? <Icon name={icon} size={17} color={color} /> : null}
        <AppText weight="semibold" style={[styles.buttonText, { color }]}>
          {title}
        </AppText>
      </View>
      {loading ? (
        <ActivityIndicator color={color} style={StyleSheet.absoluteFill} />
      ) : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  danger = false,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        danger && { backgroundColor: palette.dangerBackground },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={danger ? palette.danger : palette.text}
      />
    </Pressable>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  style,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? (
          <AppText style={{ color: palette.danger }}> *</AppText>
        ) : null}
      </AppText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          focused && { borderColor: palette.primary },
          error && { borderColor: palette.error },
          style,
        ]}
      />
      {error ? (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText style={styles.hint}>{hint}</AppText>
      ) : null}
    </View>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Chọn danh mục',
  error,
  required,
  disabled,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={styles.field}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? (
          <AppText style={{ color: palette.danger }}> *</AppText>
        ) : null}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.select,
          open && { borderColor: palette.primary },
          error && { borderColor: palette.error },
          disabled && { opacity: 0.5 },
        ]}
      >
        <AppText
          style={[styles.selectText, !selected && { color: palette.muted }]}
        >
          {selected?.label ?? placeholder}
        </AppText>
        <Icon name="chevron-down" size={18} />
      </Pressable>
      {error ? (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      ) : null}
      <AppModal visible={open} title={label} onClose={() => setOpen(false)}>
        <ScrollView
          style={{ maxHeight: 360 }}
          keyboardShouldPersistTaps="handled"
        >
          {options.length === 0 ? (
            <AppText style={styles.muted}>
              Chưa có danh mục. Tạo danh mục trước khi thêm khóa học.
            </AppText>
          ) : (
            options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: value === option.value }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  value === option.value && {
                    backgroundColor: palette.background,
                  },
                ]}
              >
                <AppText style={{ flex: 1 }}>{option.label}</AppText>
                {value === option.value ? (
                  <Icon name="check" color={palette.text} size={18} />
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>
      </AppModal>
    </View>
  );
}

export function Banner({
  message,
  kind = 'error',
  onDismiss,
}: {
  message: string;
  kind?: 'error' | 'success' | 'warning';
  onDismiss?: () => void;
}) {
  if (!message) return null;
  const color =
    kind === 'success'
      ? palette.success
      : kind === 'warning'
        ? palette.warning
        : palette.error;
  const backgroundColor =
    kind === 'success'
      ? palette.successBackground
      : kind === 'warning'
        ? palette.warningBackground
        : palette.errorBackground;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor }]}
    >
      <Icon
        name={kind === 'success' ? 'check-circle' : 'alert-circle'}
        color={color}
        size={18}
      />
      <AppText style={[styles.bannerText, { color }]}>{message}</AppText>
      {onDismiss ? (
        <IconButton icon="x" label="Đóng thông báo" onPress={onDismiss} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'book-open',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={palette.text} />
      </View>
      <AppText weight="semibold" style={styles.emptyTitle}>
        {title}
      </AppText>
      <AppText style={styles.emptyDescription}>{description}</AppText>
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

export function LoadingState({
  message = 'Đang tải dữ liệu…',
}: {
  message?: string;
}) {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={palette.primary} />
      <AppText style={styles.muted}>{message}</AppText>
    </View>
  );
}

export function ConnectionRequired() {
  return (
    <EmptyState
      icon="link"
      title="Kết nối để bắt đầu"
      description="Thêm địa chỉ MockAPI của bạn để quản lý danh mục và khóa học."
      action={
        <Button
          title="Thiết lập kết nối"
          variant="primary"
          icon="arrow-right"
          onPress={() => router.push('/settings')}
        />
      }
    />
  );
}

export function AppModal({
  visible,
  title,
  children,
  onClose,
  busy = false,
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <SafeAreaView style={styles.modalBackdrop}>
        <View accessibilityViewIsModal style={styles.modal}>
          <View style={styles.modalHeader}>
            <AppText
              weight="semibold"
              style={[styles.sectionTitle, { flex: 1 }]}
            >
              {title}
            </AppText>
            <IconButton
              icon="x"
              label="Đóng hộp thoại"
              onPress={onClose}
              disabled={busy}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContent}
          >
            {children}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function ConfirmDelete({
  visible,
  title,
  description,
  onCancel,
  onConfirm,
  loading,
  error,
}: {
  visible: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string;
}) {
  return (
    <AppModal visible={visible} title={title} onClose={onCancel} busy={loading}>
      <AppText style={styles.muted}>{description}</AppText>
      {error ? <Banner message={error} /> : null}
      <View style={styles.actions}>
        <Button
          title="Hủy"
          onPress={onCancel}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          title="Xóa"
          variant="danger"
          onPress={onConfirm}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </AppModal>
  );
}

const NAV_ITEMS = [
  { href: '/' as const, label: 'Khóa học', icon: 'book-open' as const },
  { href: '/categories' as const, label: 'Danh mục', icon: 'grid' as const },
  { href: '/settings' as const, label: 'Kết nối', icon: 'settings' as const },
];

export function Screen({
  title,
  subtitle,
  children,
  tab,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tab?: '/' | '/categories' | '/settings';
  back?: boolean;
  action?: ReactNode;
}) {
  const { notice, dismissNotice } = useCourses();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.header}>
          {back ? (
            <IconButton
              icon="arrow-left"
              label="Quay lại"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/')
              }
            />
          ) : null}
          <View style={{ flex: 1, gap: 4 }}>
            <AppText weight="bold" style={styles.pageTitle}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText style={styles.headerSubtitle}>{subtitle}</AppText>
            ) : null}
          </View>
          {action}
        </View>
        {notice ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <Banner message={notice} kind="success" onDismiss={dismissNotice} />
          </View>
        ) : null}
        <View style={styles.body}>{children}</View>
        {tab ? (
          <View style={styles.navigation}>
            {NAV_ITEMS.map((item) => (
              <Pressable
                key={item.href}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: tab === item.href }}
                onPress={() => {
                  if (tab !== item.href) router.replace(item.href);
                }}
                style={[
                  styles.navItem,
                  tab === item.href && { backgroundColor: palette.secondary },
                ]}
              >
                <Icon
                  name={item.icon}
                  size={21}
                  color={tab === item.href ? palette.text : palette.muted}
                />
                <AppText
                  weight={tab === item.href ? 'semibold' : 'medium'}
                  style={[
                    styles.navLabel,
                    { color: tab === item.href ? palette.text : palette.muted },
                  ]}
                >
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export const uiStyles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 20 },
  card: {
    backgroundColor: palette.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    gap: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: 17, lineHeight: 25, fontFamily: fonts.semibold },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12 },
});

const styles = StyleSheet.create({
  text: { color: palette.text, fontSize: 15, lineHeight: 23, flexShrink: 1 },
  screen: { flex: 1, backgroundColor: palette.background },
  shell: { flex: 1, width: '100%', maxWidth: 920, alignSelf: 'center' },
  body: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderStrong,
  },
  pageTitle: { fontSize: 20, lineHeight: 29 },
  headerSubtitle: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  button: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primary: { backgroundColor: palette.primary, borderColor: palette.primary },
  outline: {
    backgroundColor: palette.surface,
    borderColor: palette.borderStrong,
  },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: {
    backgroundColor: palette.dangerBackground,
    borderColor: 'transparent',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 8 },
  label: { fontSize: 14, lineHeight: 21 },
  input: {
    minHeight: 44,
    width: '100%',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: palette.text,
  },
  multiline: { minHeight: 108, textAlignVertical: 'top' },
  hint: { fontSize: 12, lineHeight: 19, color: palette.muted },
  fieldError: { fontSize: 12, lineHeight: 19, color: palette.error },
  select: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
    borderRadius: 12,
    gap: 8,
  },
  selectText: { flex: 1 },
  option: {
    padding: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 20 },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, lineHeight: 27, textAlign: 'center' },
  emptyDescription: {
    color: palette.muted,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 23,
  },
  muted: { color: palette.muted },
  sectionTitle: { fontSize: 18, lineHeight: 27 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: palette.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderStrong,
  },
  modalContent: { padding: 20, gap: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.borderStrong,
  },
  navItem: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    borderRadius: 12,
  },
  navLabel: { fontSize: 12, lineHeight: 18 },
});
