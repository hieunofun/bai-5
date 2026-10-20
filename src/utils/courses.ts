import type {
  Category,
  Course,
  CourseFormErrors,
  CourseFormValues,
  CourseInput,
} from '@/types/course';

export function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Nhập Base URL đầy đủ, bắt đầu bằng https://.');
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.mockapi.io')) {
    throw new Error(
      'Dùng Base URL HTTPS của project MockAPI, ví dụ https://<project-id>.mockapi.io/api/v1.',
    );
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /YOUR_PROJECT_ID/i.test(trimmed)
  ) {
    throw new Error(
      'Base URL không được chứa tài khoản, query, fragment hoặc mã project minh họa.',
    );
  }
  if (/\/(categories|courses)(\/|$)/i.test(url.pathname)) {
    throw new Error(
      'Nhập URL gốc của API; bỏ phần /categories hoặc /courses ở cuối.',
    );
  }
  return trimmed;
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function validateCourse(
  values: CourseFormValues,
  categories: Category[],
): CourseFormErrors {
  const errors: CourseFormErrors = {};
  if (!values.title.trim()) errors.title = 'Nhập tên khóa học.';
  if (!values.description.trim()) errors.description = 'Nhập mô tả khóa học.';
  if (!values.instructor.trim()) errors.instructor = 'Nhập tên giảng viên.';
  if (!categories.some((category) => category.id === values.categoryId)) {
    errors.categoryId = 'Chọn một danh mục đang tồn tại.';
  }
  // Accept a decimal comma, but reject scientific notation and ambiguous thousand separators.
  const decimal = /^\d+(?:[.,]\d+)?$/;
  if (
    !decimal.test(values.price.trim()) ||
    !Number.isFinite(Number(values.price.replace(',', '.')))
  ) {
    errors.price = 'Nhập học phí hợp lệ, không âm (0 nếu miễn phí).';
  }
  if (
    !decimal.test(values.duration.trim()) ||
    !Number.isFinite(Number(values.duration.replace(',', '.'))) ||
    Number(values.duration.replace(',', '.')) <= 0
  ) {
    errors.duration = 'Thời lượng phải là số lớn hơn 0.';
  }
  if (!isHttpsUrl(values.thumbnail))
    errors.thumbnail = 'Nhập URL ảnh HTTPS hợp lệ.';
  if (!isHttpsUrl(values.trailerUrl)) {
    errors.trailerUrl = 'Nhập URL video HTTPS trực tiếp.';
  } else {
    const url = new URL(values.trailerUrl.trim());
    if (!/\.mp4$/i.test(url.pathname))
      errors.trailerUrl =
        'Dùng URL video .mp4 trực tiếp; không dùng link trang YouTube.';
  }
  return errors;
}

export function toCourseInput(values: CourseFormValues): CourseInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    categoryId: values.categoryId,
    instructor: values.instructor.trim(),
    price: Number(values.price.trim().replace(',', '.')),
    duration: Number(values.duration.trim().replace(',', '.')),
    thumbnail: values.thumbnail.trim(),
    trailerUrl: values.trailerUrl.trim(),
  };
}

export function searchCourses(
  courses: Course[],
  query: string,
  categoryId: string,
): Course[] {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLocaleLowerCase('vi')
      .trim();
  const keyword = normalize(query);
  return courses.filter(
    (course) =>
      (!categoryId || course.categoryId === categoryId) &&
      normalize(course.title).includes(keyword),
  );
}

export function formatPrice(price: number): string {
  return price === 0
    ? 'Miễn phí'
    : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(price)} đ`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chưa có ngày tạo'
    : date.toLocaleDateString('vi-VN');
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Có lỗi xảy ra. Vui lòng thử lại.';
}
