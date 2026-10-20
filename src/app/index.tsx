import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { CourseCover } from '@/components/course-cover';
import {
  AppText,
  Banner,
  Button,
  ConnectionRequired,
  EmptyState,
  Field,
  Icon,
  IconButton,
  LoadingState,
  Screen,
  SelectField,
  uiStyles,
} from '@/components/course-ui';
import { palette } from '@/constants/course-theme';
import { useCourses } from '@/providers/course-provider';
import { formatPrice, searchCourses } from '@/utils/courses';

export default function CoursesScreen() {
  const {
    baseUrl,
    ready,
    loading,
    refreshing,
    error,
    categories,
    courses,
    refresh,
  } = useCourses();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { width } = useWindowDimensions();
  const columns = width >= 680 ? 2 : 1;
  const filtered = useMemo(
    () => searchCourses(courses, query, categoryId),
    [courses, query, categoryId],
  );
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const hasFilters = Boolean(query.trim() || categoryId);
  return (
    <Screen
      title="Khóa học"
      subtitle="Quản lý nội dung học tập"
      tab="/"
      action={
        baseUrl ? (
          <IconButton
            icon="plus"
            label="Thêm khóa học"
            onPress={() => router.push('/courses/form')}
          />
        ) : undefined
      }
    >
      {!ready ? (
        <LoadingState />
      ) : !baseUrl ? (
        <ConnectionRequired />
      ) : (
        <FlatList
          key={columns}
          data={loading ? [] : filtered}
          numColumns={columns}
          keyExtractor={(course) => course.id}
          contentContainerStyle={uiStyles.content}
          columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={6}
          refreshControl={
            <RefreshControl
              refreshing={refreshing && !loading}
              onRefresh={() => void refresh()}
              tintColor={palette.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.filters}>
              {error ? (
                <>
                  <Banner message={error} />
                  <Button
                    title="Thử tải lại"
                    icon="refresh-cw"
                    onPress={() => void refresh()}
                    loading={refreshing}
                  />
                </>
              ) : null}
              <View style={uiStyles.card}>
                <Field
                  label="Tìm khóa học"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Nhập tên khóa học…"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                <SelectField
                  label="Danh mục"
                  value={categoryId}
                  options={[
                    { label: 'Tất cả danh mục', value: '' },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                  onChange={setCategoryId}
                />
              </View>
              <View style={styles.resultHeader}>
                <AppText weight="semibold" style={uiStyles.sectionTitle}>
                  {loading
                    ? 'Thư viện khóa học'
                    : `${filtered.length} khóa học`}
                </AppText>
                {hasFilters ? (
                  <Button
                    title="Xóa lọc"
                    variant="ghost"
                    onPress={() => {
                      setQuery('');
                      setCategoryId('');
                    }}
                  />
                ) : (
                  <Button
                    title="Làm mới"
                    icon="refresh-cw"
                    variant="ghost"
                    onPress={() => void refresh()}
                    loading={refreshing}
                  />
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <LoadingState />
            ) : error ? (
              <EmptyState
                icon="wifi-off"
                title="Chưa tải được dữ liệu"
                description="Thử lại khi kết nối mạng ổn định hoặc kiểm tra địa chỉ API trong tab Kết nối."
              />
            ) : (
              <EmptyState
                title={
                  hasFilters ? 'Không tìm thấy khóa học' : 'Chưa có khóa học'
                }
                description={
                  hasFilters
                    ? 'Thử tên khác hoặc chọn tất cả danh mục.'
                    : 'Thêm khóa học đầu tiên để bắt đầu xây dựng thư viện.'
                }
                action={
                  hasFilters ? (
                    <Button
                      title="Xóa bộ lọc"
                      onPress={() => {
                        setQuery('');
                        setCategoryId('');
                      }}
                    />
                  ) : (
                    <Button
                      title="Thêm khóa học"
                      variant="primary"
                      icon="plus"
                      onPress={() => router.push('/courses/form')}
                    />
                  )
                }
              />
            )
          }
          renderItem={({ item: course }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xem khóa học ${course.title}`}
              onPress={() =>
                router.push({
                  pathname: '/courses/[id]',
                  params: { id: course.id },
                })
              }
              style={({ pressed }) => [
                styles.courseCard,
                { flex: 1, maxWidth: columns > 1 ? '50%' : '100%' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <CourseCover uri={course.thumbnail} title={course.title} />
              <View style={styles.courseContent}>
                <AppText style={styles.category}>
                  {categoryNames.get(course.categoryId) ??
                    'Danh mục không còn tồn tại'}
                </AppText>
                <AppText
                  weight="semibold"
                  style={styles.courseTitle}
                  numberOfLines={2}
                >
                  {course.title}
                </AppText>
                <View style={uiStyles.row}>
                  <Icon name="user" size={15} />
                  <AppText style={styles.instructor}>
                    {course.instructor}
                  </AppText>
                </View>
                <View style={styles.courseFooter}>
                  <AppText weight="semibold" style={styles.price}>
                    {formatPrice(course.price)}
                  </AppText>
                  <View style={styles.duration}>
                    <Icon name="clock" size={15} />
                    <AppText style={styles.instructor}>
                      {course.duration} giờ
                    </AppText>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 16, paddingBottom: 12 },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  courseCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 12,
  },
  courseContent: { gap: 8, paddingHorizontal: 4, paddingBottom: 4 },
  category: { fontSize: 12, lineHeight: 19, color: palette.muted },
  courseTitle: { fontSize: 17, lineHeight: 25 },
  instructor: { fontSize: 13, lineHeight: 20, color: palette.muted },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.borderStrong,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  price: { fontSize: 17, lineHeight: 25 },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
