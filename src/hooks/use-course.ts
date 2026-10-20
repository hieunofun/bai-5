import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useCourses } from '@/providers/course-provider';
import type { Course } from '@/types/course';
import { errorMessage } from '@/utils/courses';

export function useCourse(id?: string) {
  const { api, baseUrl, ready } = useCourses();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!id || !baseUrl || !ready) {
      setLoading(false);
      return;
    }
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const data = await api.getCourse(id);
      if (current === generation.current) setCourse(data);
    } catch (err) {
      if (current === generation.current) {
        setError(errorMessage(err));
        setCourse(null);
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [api, baseUrl, ready, id]);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current += 1;
      };
    }, [load]),
  );
  return {
    course,
    loading,
    error,
    retry: () => {
      void load();
    },
  };
}
