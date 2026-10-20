import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CourseCover } from '@/components/course-cover';
import {
  AppText,
  Banner,
  Button,
  ConfirmDelete,
  ConnectionRequired,
  EmptyState,
  Icon,
  LoadingState,
  Screen,
  uiStyles,
} from '@/components/course-ui';
import { TrailerPlayer } from '@/components/trailer-player';
import { palette } from '@/constants/course-theme';
import { useCourse } from '@/hooks/use-course';
import { useCourses } from '@/providers/course-provider';
import { errorMessage, formatDate, formatPrice } from '@/utils/courses';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    baseUrl,
    categories,
    deleteCourse,
    ready,
    loading: dataLoading,
    error: dataError,
  } = useCourses();
  const { course, loading, error, retry } = useCourse(id);
  const [showTrailer, setShowTrailer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const categoryName = categories.find(
    (category) => category.id === course?.categoryId,
  )?.name;
  async function remove() {
    if (!course || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteCourse(course.id);
      setConfirm(false);
      router.dismissTo('/');
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Screen title="Chi tiết khóa học" back>
      {!ready ? (
        <LoadingState />
      ) : !baseUrl ? (
        <ConnectionRequired />
      ) : loading ? (
        <LoadingState />
      ) : error || !course ? (
        <EmptyState
          icon="alert-circle"
          title="Không tải được khóa học"
          description={error || 'Khóa học không tồn tại.'}
          action={<Button title="Thử lại" onPress={retry} />}
        />
      ) : (
        <ScrollView contentContainerStyle={uiStyles.content}>
          {dataError ? <Banner message={dataError} /> : null}
          <CourseCover uri={course.thumbnail} title={course.title} />
          <View style={uiStyles.card}>
            <AppText style={styles.category}>
              {categoryName ??
                (dataLoading
                  ? 'Đang tải danh mục…'
                  : 'Danh mục không còn tồn tại')}
            </AppText>
            <AppText weight="bold" style={styles.title}>
              {course.title}
            </AppText>
            <View style={uiStyles.row}>
              <Icon name="user" size={18} />
              <AppText>{course.instructor}</AppText>
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <AppText style={uiStyles.muted}>Học phí</AppText>
                <AppText weight="semibold" style={styles.statValue}>
                  {formatPrice(course.price)}
                </AppText>
              </View>
              <View style={styles.stat}>
                <AppText style={uiStyles.muted}>Thời lượng</AppText>
                <AppText weight="semibold" style={styles.statValue}>
                  {course.duration} giờ
                </AppText>
              </View>
            </View>
            <View style={uiStyles.row}>
              <Icon name="calendar" size={16} />
              <AppText style={uiStyles.muted}>
                Ngày tạo: {formatDate(course.createdAt)}
              </AppText>
            </View>
          </View>
          <View style={uiStyles.card}>
            <AppText weight="semibold" style={uiStyles.sectionTitle}>
              Giới thiệu khóa học
            </AppText>
            <AppText>{course.description || 'Chưa có mô tả.'}</AppText>
          </View>
          <View style={uiStyles.card}>
            <AppText weight="semibold" style={uiStyles.sectionTitle}>
              Trailer khóa học
            </AppText>
            {!course.trailerUrl ? (
              <AppText style={uiStyles.muted}>Chưa có trailer.</AppText>
            ) : showTrailer ? (
              <>
                <TrailerPlayer
                  key={course.trailerUrl}
                  url={course.trailerUrl}
                />
                <Button
                  title="Đóng trailer"
                  variant="ghost"
                  onPress={() => setShowTrailer(false)}
                />
              </>
            ) : (
              <Button
                title="Xem trailer"
                variant="primary"
                icon="play"
                onPress={() => setShowTrailer(true)}
              />
            )}
          </View>
          <View style={uiStyles.wrapRow}>
            <Button
              title="Sửa khóa học"
              icon="edit-2"
              onPress={() =>
                router.push({
                  pathname: '/courses/form',
                  params: { id: course.id },
                })
              }
              style={{ flexGrow: 1 }}
            />
            <Button
              title="Xóa khóa học"
              icon="trash-2"
              variant="danger"
              onPress={() => {
                setDeleteError('');
                setConfirm(true);
              }}
              style={{ flexGrow: 1 }}
            />
          </View>
        </ScrollView>
      )}
      <ConfirmDelete
        visible={confirm}
        title="Xóa khóa học?"
        description={`“${course?.title ?? ''}” sẽ bị xóa vĩnh viễn khỏi MockAPI.`}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void remove()}
        loading={deleting}
        error={deleteError}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  title: { fontSize: 24, lineHeight: 34 },
  stats: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.borderStrong,
  },
  stat: { flexGrow: 1, gap: 4 },
  statValue: { fontSize: 18, lineHeight: 27 },
});
