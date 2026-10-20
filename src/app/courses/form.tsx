import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { CourseCover } from '@/components/course-cover';
import {
  AppText,
  Banner,
  Button,
  ConnectionRequired,
  EmptyState,
  Field,
  LoadingState,
  Screen,
  SelectField,
  uiStyles,
} from '@/components/course-ui';
import { useCourse } from '@/hooks/use-course';
import { useCourses } from '@/providers/course-provider';
import type { CourseFormErrors, CourseFormValues } from '@/types/course';
import {
  errorMessage,
  isHttpsUrl,
  toCourseInput,
  validateCourse,
} from '@/utils/courses';

const EMPTY_FORM: CourseFormValues = {
  title: '',
  description: '',
  categoryId: '',
  instructor: '',
  price: '',
  duration: '',
  thumbnail: '',
  trailerUrl: '',
};

export default function CourseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    baseUrl,
    ready,
    categories,
    saveCourse,
    loading: dataLoading,
    error: dataError,
    refresh,
    refreshing,
  } = useCourses();
  const { course, loading, error, retry } = useCourse(id);
  const [values, setValues] = useState<CourseFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const initializedId = useRef('');
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!course || !id || initializedId.current === id) return;
    initializedId.current = id;
    setValues({
      title: course.title,
      description: course.description,
      categoryId: course.categoryId,
      instructor: course.instructor,
      price: String(course.price),
      duration: String(course.duration),
      thumbnail: course.thumbnail,
      trailerUrl: course.trailerUrl,
    });
  }, [course, id]);
  function update(key: keyof CourseFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setSubmitError('');
  }
  async function submit() {
    if (saving) return;
    const nextErrors = validateCourse(values, categories);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSubmitError('Kiểm tra các trường được đánh dấu trước khi lưu.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      const saved = await saveCourse(toCourseInput(values), id);
      if (id && router.canGoBack()) router.back();
      else
        router.replace({ pathname: '/courses/[id]', params: { id: saved.id } });
    } catch (err) {
      setSubmitError(errorMessage(err));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen title={id ? 'Sửa khóa học' : 'Thêm khóa học'} back>
      {!ready ? (
        <LoadingState />
      ) : !baseUrl ? (
        <ConnectionRequired />
      ) : (id && loading) || dataLoading ? (
        <LoadingState />
      ) : id && (error || !course) ? (
        <EmptyState
          icon="alert-circle"
          title="Không tải được khóa học"
          description={error || 'Khóa học không tồn tại.'}
          action={<Button title="Thử lại" onPress={retry} />}
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={uiStyles.content}
          >
            {submitError ? <Banner message={submitError} /> : null}
            {dataError ? (
              <>
                <Banner message={dataError} />
                <Button
                  title="Tải lại danh mục"
                  onPress={() => void refresh()}
                  loading={refreshing}
                />
              </>
            ) : null}
            <View style={uiStyles.card}>
              <AppText weight="semibold" style={uiStyles.sectionTitle}>
                Thông tin khóa học
              </AppText>
              <Field
                label="Tên khóa học"
                required
                value={values.title}
                onChangeText={(value) => update('title', value)}
                error={errors.title}
                editable={!saving}
              />
              <Field
                label="Mô tả"
                required
                multiline
                value={values.description}
                onChangeText={(value) => update('description', value)}
                error={errors.description}
                editable={!saving}
              />
              <Field
                label="Giảng viên"
                required
                value={values.instructor}
                onChangeText={(value) => update('instructor', value)}
                error={errors.instructor}
                editable={!saving}
              />
              <SelectField
                label="Danh mục"
                required
                value={values.categoryId}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
                onChange={(value) => update('categoryId', value)}
                error={errors.categoryId}
                disabled={saving}
              />
              {categories.length === 0 && !dataError ? (
                <>
                  <AppText style={uiStyles.muted}>
                    Tạo danh mục trước khi thêm khóa học.
                  </AppText>
                  <Button
                    title="Quản lý danh mục"
                    onPress={() => router.push('/categories')}
                  />
                </>
              ) : null}
              <Field
                label="Học phí (VNĐ)"
                required
                value={values.price}
                onChangeText={(value) => update('price', value)}
                error={errors.price}
                keyboardType="decimal-pad"
                hint="Nhập 0 cho khóa học miễn phí; không nhập dấu phân cách hàng nghìn."
                editable={!saving}
              />
              <Field
                label="Thời lượng (giờ)"
                required
                value={values.duration}
                onChangeText={(value) => update('duration', value)}
                error={errors.duration}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>
            <View style={uiStyles.card}>
              <AppText weight="semibold" style={uiStyles.sectionTitle}>
                Ảnh bìa và trailer
              </AppText>
              <Field
                label="URL ảnh bìa"
                required
                value={values.thumbnail}
                onChangeText={(value) => update('thumbnail', value)}
                error={errors.thumbnail}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                hint="URL HTTPS dẫn trực tiếp tới ảnh."
                editable={!saving}
              />
              {isHttpsUrl(values.thumbnail) ? (
                <CourseCover
                  uri={values.thumbnail.trim()}
                  title={values.title || 'xem trước'}
                />
              ) : null}
              <Field
                label="URL trailer"
                required
                value={values.trailerUrl}
                onChangeText={(value) => update('trailerUrl', value)}
                error={errors.trailerUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                hint="Dùng link .mp4 HTTPS trực tiếp để phát trong ứng dụng."
                editable={!saving}
              />
            </View>
            <View style={uiStyles.actions}>
              <Button
                title="Hủy"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace('/')
                }
                disabled={saving}
                style={{ flex: 1 }}
              />
              <Button
                title={id ? 'Lưu thay đổi' : 'Thêm khóa học'}
                variant="primary"
                onPress={() => void submit()}
                loading={saving}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}
