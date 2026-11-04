import { categoryApi } from '../api';
import { useApi } from './useApi';

export function useCategories() {
  const { data, loading, error, reload } = useApi(() => categoryApi.list(), []);
  return { categories: data ?? [], loading, error, reload };
}
