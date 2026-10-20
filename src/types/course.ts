export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  instructor: string;
  price: number;
  duration: number;
  thumbnail: string;
  trailerUrl: string;
  createdAt: string;
}

export type CategoryInput = Omit<Category, 'id'>;
export type CourseInput = Omit<Course, 'id' | 'createdAt'>;

export interface CourseFormValues {
  title: string;
  description: string;
  categoryId: string;
  instructor: string;
  price: string;
  duration: string;
  thumbnail: string;
  trailerUrl: string;
}

export type CourseFormErrors = Partial<Record<keyof CourseFormValues, string>>;
