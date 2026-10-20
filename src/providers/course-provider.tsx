import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { createApi } from '@/services/api';
import type {
  Category,
  CategoryInput,
  Course,
  CourseInput,
} from '@/types/course';
import {
  errorMessage,
  normalizeBaseUrl,
  validateCourse,
} from '@/utils/courses';

const STORAGE_KEY = 'course-manager:base-url';
const ENV_URL = process.env.EXPO_PUBLIC_MOCKAPI_BASE_URL?.trim() ?? '';

interface CourseContextValue {
  baseUrl: string;
  ready: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string;
  notice: string;
  categories: Category[];
  courses: Course[];
  api: ReturnType<typeof createApi>;
  refresh: () => Promise<boolean>;
  configure: (url: string) => Promise<void>;
  saveCourse: (input: CourseInput, id?: string) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  saveCategory: (input: CategoryInput, id?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  dismissNotice: () => void;
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrl] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const generation = useRef(0);
  const api = useMemo(() => createApi(baseUrl), [baseUrl]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && (saved || ENV_URL)) {
          const url = normalizeBaseUrl(saved || ENV_URL);
          setBaseUrl(url);
          setLoading(true);
          const initialApi = createApi(url);
          const [nextCategories, nextCourses] = await Promise.all([
            initialApi.getCategories(),
            initialApi.getCourses(),
          ]);
          if (active) {
            setCategories(nextCategories);
            setCourses(nextCourses);
          }
        }
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) {
          setReady(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!baseUrl) return false;
    const current = ++generation.current;
    setRefreshing(true);
    try {
      const [nextCategories, nextCourses] = await Promise.all([
        api.getCategories(),
        api.getCourses(),
      ]);
      if (current === generation.current) {
        setCategories(nextCategories);
        setCourses(nextCourses);
        setError('');
      }
      return true;
    } catch (err) {
      if (current === generation.current) setError(errorMessage(err));
      return false;
    } finally {
      if (current === generation.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, [api, baseUrl]);

  async function configure(value: string) {
    const url = normalizeBaseUrl(value);
    const candidate = createApi(url);
    // Check both resources before replacing a working connection.
    const [nextCategories, nextCourses] = await Promise.all([
      candidate.getCategories(),
      candidate.getCourses(),
    ]);
    await AsyncStorage.setItem(STORAGE_KEY, url);
    generation.current += 1;
    setCategories(nextCategories);
    setCourses(nextCourses);
    setBaseUrl(url);
    setError('');
    setNotice('Đã kết nối MockAPI.');
  }

  async function syncAfterMutation(message: string) {
    const synced = await refresh();
    setNotice(
      synced
        ? message
        : `${message} Chưa tải lại được dữ liệu mới; hãy thử làm mới danh sách.`,
    );
  }

  async function saveCourse(input: CourseInput, id?: string) {
    const liveCategories = await api.getCategories();
    const errors = validateCourse(
      {
        ...input,
        price: String(input.price),
        duration: String(input.duration),
      },
      liveCategories,
    );
    const firstError = Object.values(errors)[0];
    if (firstError) throw new Error(firstError);
    const saved = await api.saveCourse(input, id);
    setCourses((previous) =>
      id
        ? previous.map((course) => (course.id === id ? saved : course))
        : [...previous, saved],
    );
    await syncAfterMutation(id ? 'Đã cập nhật khóa học.' : 'Đã thêm khóa học.');
    return saved;
  }

  async function deleteCourse(id: string) {
    await api.deleteCourse(id);
    setCourses((previous) => previous.filter((course) => course.id !== id));
    await syncAfterMutation('Đã xóa khóa học.');
  }

  async function saveCategory(input: CategoryInput, id?: string) {
    if (!input.name.trim()) throw new Error('Nhập tên danh mục.');
    const saved = await api.saveCategory(
      { name: input.name.trim(), description: input.description.trim() },
      id,
    );
    setCategories((previous) =>
      id
        ? previous.map((category) => (category.id === id ? saved : category))
        : [...previous, saved],
    );
    await syncAfterMutation(id ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.');
  }

  async function deleteCategory(id: string) {
    // Re-fetch all courses: checking only filtered or cached rows could allow an orphan.
    const liveCourses = await api.getCourses();
    setCourses(liveCourses);
    if (liveCourses.some((course) => course.categoryId === id)) {
      throw new Error(
        'Danh mục đang có khóa học. Chuyển hoặc xóa các khóa học trước khi xóa danh mục.',
      );
    }
    await api.deleteCategory(id);
    setCategories((previous) =>
      previous.filter((category) => category.id !== id),
    );
    await syncAfterMutation('Đã xóa danh mục.');
  }

  return (
    <CourseContext.Provider
      value={{
        baseUrl,
        ready,
        loading,
        refreshing,
        error,
        notice,
        categories,
        courses,
        api,
        refresh,
        configure,
        saveCourse,
        deleteCourse,
        saveCategory,
        deleteCategory,
        dismissNotice: () => setNotice(''),
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourses must be inside CourseProvider.');
  return context;
}
