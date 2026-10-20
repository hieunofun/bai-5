import type {
  Category,
  CategoryInput,
  Course,
  CourseInput,
} from '@/types/course';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError(
      'API trả về dữ liệu không đúng cấu trúc. Kiểm tra schema MockAPI.',
    );
  return value as Record<string, unknown>;
}

function text(value: unknown, required = false): string {
  const result =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  if (required && !result.trim())
    throw new ApiError(
      'Dữ liệu API thiếu trường bắt buộc. Kiểm tra schema trong README.',
    );
  return result;
}

function number(value: unknown): number {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    String(value).trim() === '' ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  ) {
    throw new ApiError(
      'Học phí hoặc thời lượng trên API không hợp lệ. Kiểm tra dữ liệu MockAPI.',
    );
  }
  return Number(value);
}

export function parseCategory(value: unknown): Category {
  const data = record(value);
  return {
    id: text(data.id, true),
    name: text(data.name, true),
    description: text(data.description),
  };
}

export function parseCourse(value: unknown): Course {
  const data = record(value);
  return {
    id: text(data.id, true),
    title: text(data.title, true),
    description: text(data.description),
    categoryId: text(data.categoryId, true),
    instructor: text(data.instructor, true),
    price: number(data.price),
    duration: number(data.duration),
    thumbnail: text(data.thumbnail),
    trailerUrl: text(data.trailerUrl),
    createdAt: text(data.createdAt),
  };
}

function list<T>(value: unknown, parser: (item: unknown) => T): T[] {
  if (!Array.isArray(value))
    throw new ApiError(
      'Endpoint phải trả về một mảng JSON. Kiểm tra resource MockAPI.',
    );
  return value.map(parser);
}

export function createApi(baseUrl: string) {
  async function request(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<unknown> {
    if (!baseUrl)
      throw new ApiError('Thiết lập kết nối MockAPI trước khi tiếp tục.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers:
          body === undefined
            ? { Accept: 'application/json' }
            : {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        const message =
          response.status === 404
            ? 'Không tìm thấy resource hoặc bản ghi. Kiểm tra URL và hai resource categories, courses.'
            : response.status === 429
              ? 'MockAPI đang giới hạn số yêu cầu. Chờ một lát rồi thử lại.'
              : `Yêu cầu API thất bại (HTTP ${response.status}). Vui lòng thử lại.`;
        throw new ApiError(message, response.status);
      }
      if (response.status === 204) return null;
      try {
        return await response.json();
      } catch {
        throw new ApiError('API không trả về JSON hợp lệ. Kiểm tra Base URL.');
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted)
        throw new ApiError('Kết nối quá 15 giây. Kiểm tra mạng rồi thử lại.');
      throw new ApiError(
        'Không kết nối được MockAPI. Kiểm tra mạng và Base URL.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    getCategories: async () =>
      list(await request('/categories'), parseCategory),
    getCourses: async () => list(await request('/courses'), parseCourse),
    getCourse: async (id: string) =>
      parseCourse(await request(`/courses/${encodeURIComponent(id)}`)),
    saveCourse: async (input: CourseInput, id?: string) =>
      parseCourse(
        await request(
          id ? `/courses/${encodeURIComponent(id)}` : '/courses',
          id ? 'PUT' : 'POST',
          id ? input : { ...input, createdAt: new Date().toISOString() },
        ),
      ),
    deleteCourse: async (id: string) => {
      await request(`/courses/${encodeURIComponent(id)}`, 'DELETE');
    },
    saveCategory: async (input: CategoryInput, id?: string) =>
      parseCategory(
        await request(
          id ? `/categories/${encodeURIComponent(id)}` : '/categories',
          id ? 'PUT' : 'POST',
          input,
        ),
      ),
    deleteCategory: async (id: string) => {
      await request(`/categories/${encodeURIComponent(id)}`, 'DELETE');
    },
  };
}
