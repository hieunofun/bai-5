import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
  AppModal,
  AppText,
  Banner,
  Button,
  ConfirmDelete,
  ConnectionRequired,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  Screen,
  uiStyles,
} from '@/components/course-ui';
import { palette } from '@/constants/course-theme';
import { useCourses } from '@/providers/course-provider';
import type { Category } from '@/types/course';
import { errorMessage } from '@/utils/courses';

export default function CategoriesScreen() {
  const {
    baseUrl,
    ready,
    categories,
    courses,
    loading,
    refreshing,
    error,
    refresh,
    saveCategory,
    deleteCategory,
  } = useCourses();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const course of courses)
      result.set(course.categoryId, (result.get(course.categoryId) ?? 0) + 1);
    return result;
  }, [courses]);

  function openEditor(category: Category | null) {
    setEditing(category);
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setNameError('');
    setFormError('');
    setEditorOpen(true);
  }
  async function submit() {
    if (saving) return;
    if (!name.trim()) {
      setNameError('Nhập tên danh mục.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await saveCategory({ name, description }, editing?.id);
      setEditorOpen(false);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!target || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteCategory(target.id);
      setTarget(null);
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen
      title="Danh mục"
      subtitle="Sắp xếp khóa học theo chủ đề"
      tab="/categories"
      action={
        baseUrl ? (
          <IconButton
            icon="plus"
            label="Thêm danh mục"
            onPress={() => openEditor(null)}
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
          data={loading ? [] : categories}
          keyExtractor={(category) => category.id}
          contentContainerStyle={uiStyles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing && !loading}
              onRefresh={() => void refresh()}
              tintColor={palette.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              {error ? <Banner message={error} /> : null}
              <View style={styles.resultHeader}>
                <AppText weight="semibold" style={uiStyles.sectionTitle}>
                  {categories.length} danh mục
                </AppText>
                <Button
                  title="Làm mới"
                  icon="refresh-cw"
                  variant="ghost"
                  onPress={() => void refresh()}
                  loading={refreshing}
                />
              </View>
              <AppText style={[uiStyles.muted, { paddingBottom: 8 }]}>
                Chỉ có thể xóa danh mục chưa có khóa học.
              </AppText>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            loading ? (
              <LoadingState />
            ) : error ? (
              <EmptyState
                icon="wifi-off"
                title="Chưa tải được danh mục"
                description="Kiểm tra kết nối và thử làm mới danh sách."
              />
            ) : (
              <EmptyState
                icon="grid"
                title="Chưa có danh mục"
                description="Tạo danh mục để phân loại các khóa học."
                action={
                  <Button
                    title="Thêm danh mục"
                    variant="primary"
                    icon="plus"
                    onPress={() => openEditor(null)}
                  />
                }
              />
            )
          }
          renderItem={({ item: category }) => (
            <View style={uiStyles.card}>
              <View style={styles.categoryRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText weight="semibold" style={uiStyles.sectionTitle}>
                    {category.name}
                  </AppText>
                  <AppText style={uiStyles.muted}>
                    {counts.get(category.id) ?? 0} khóa học
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <IconButton
                    icon="edit-2"
                    label={`Sửa danh mục ${category.name}`}
                    onPress={() => openEditor(category)}
                  />
                  <IconButton
                    icon="trash-2"
                    label={`Xóa danh mục ${category.name}`}
                    danger
                    disabled={
                      Boolean(counts.get(category.id)) || Boolean(error)
                    }
                    onPress={() => {
                      setDeleteError('');
                      setTarget(category);
                    }}
                  />
                </View>
              </View>
              {category.description ? (
                <AppText style={uiStyles.muted}>{category.description}</AppText>
              ) : null}
            </View>
          )}
        />
      )}
      <AppModal
        visible={editorOpen}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        onClose={() => setEditorOpen(false)}
        busy={saving}
      >
        {formError ? <Banner message={formError} /> : null}
        <Field
          label="Tên danh mục"
          required
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameError('');
          }}
          error={nameError}
          editable={!saving}
        />
        <Field
          label="Mô tả danh mục"
          multiline
          value={description}
          onChangeText={setDescription}
          editable={!saving}
        />
        <View style={uiStyles.actions}>
          <Button
            title="Hủy"
            onPress={() => setEditorOpen(false)}
            disabled={saving}
            style={{ flex: 1 }}
          />
          <Button
            title={editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
            variant="primary"
            onPress={() => void submit()}
            loading={saving}
            style={{ flex: 2 }}
          />
        </View>
      </AppModal>
      <ConfirmDelete
        visible={Boolean(target)}
        title="Xóa danh mục?"
        description={`“${target?.name ?? ''}” sẽ bị xóa vĩnh viễn. Ứng dụng sẽ kiểm tra lại các khóa học trước khi xóa.`}
        onCancel={() => setTarget(null)}
        onConfirm={() => void remove()}
        loading={deleting}
        error={deleteError}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
