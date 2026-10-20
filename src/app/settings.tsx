import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AppText,
  Banner,
  Button,
  Field,
  Icon,
  LoadingState,
  Screen,
  uiStyles,
} from '@/components/course-ui';
import { palette } from '@/constants/course-theme';
import { useCourses } from '@/providers/course-provider';
import { errorMessage } from '@/utils/courses';

export default function SettingsScreen() {
  const {
    baseUrl,
    ready,
    configure,
    categories,
    courses,
    error: connectionError,
  } = useCourses();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? baseUrl;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function connect() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await configure(value);
      router.dismissTo('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen
      title="Kết nối"
      subtitle="Thiết lập nguồn dữ liệu MockAPI"
      tab="/settings"
    >
      {!ready ? (
        <LoadingState />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={uiStyles.content}
          >
            {baseUrl ? (
              <Banner
                kind={connectionError ? 'warning' : 'success'}
                message={
                  connectionError
                    ? 'Đã lưu địa chỉ API, nhưng hiện chưa tải được dữ liệu.'
                    : `Đã lưu kết nối · ${categories.length} danh mục · ${courses.length} khóa học`
                }
              />
            ) : null}
            <View style={uiStyles.card}>
              <View style={uiStyles.row}>
                <Icon name="link" color={palette.text} />
                <AppText weight="semibold" style={uiStyles.sectionTitle}>
                  Địa chỉ API của bạn
                </AppText>
              </View>
              <AppText style={uiStyles.muted}>
                Ứng dụng đọc và lưu khóa học trực tiếp trên project MockAPI của
                bạn.
              </AppText>
              <Field
                label="Base URL"
                required
                value={value}
                onChangeText={(next) => {
                  setDraft(next);
                  setError('');
                }}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://<project-id>.mockapi.io/api/v1"
                hint="URL gốc, không có /courses hoặc /categories ở cuối."
                editable={!saving}
              />
              {error ? <Banner message={error} /> : null}
              <Button
                title="Kiểm tra và lưu kết nối"
                variant="primary"
                loading={saving}
                onPress={() => void connect()}
              />
              <AppText style={styles.note}>
                Địa chỉ được lưu trên thiết bị để dùng trong lần mở tiếp theo.
              </AppText>
            </View>
            <View style={uiStyles.card}>
              <AppText weight="semibold" style={uiStyles.sectionTitle}>
                Chưa có MockAPI?
              </AppText>
              {[
                [
                  '1',
                  'Tạo project',
                  'Mở MockAPI, đăng nhập và tạo một project mới.',
                ],
                [
                  '2',
                  'Tạo hai resource',
                  'Thêm categories và courses với các trường dữ liệu theo README của bài.',
                ],
                [
                  '3',
                  'Kết nối ứng dụng',
                  'Sao chép Base URL, nhập ở trên và lưu kết nối.',
                ],
              ].map(([step, title, description]) => (
                <View key={step} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <AppText weight="semibold">{step}</AppText>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText weight="semibold">{title}</AppText>
                    <AppText style={uiStyles.muted}>{description}</AppText>
                  </View>
                </View>
              ))}
              <Link href="https://mockapi.io" asChild>
                <Pressable accessibilityRole="link" style={styles.externalLink}>
                  <AppText weight="medium">Mở MockAPI</AppText>
                  <Icon name="external-link" size={17} color={palette.text} />
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalLink: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 12,
    padding: 12,
  },
  note: { color: palette.muted, fontSize: 12, lineHeight: 19 },
});
