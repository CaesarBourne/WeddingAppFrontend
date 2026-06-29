import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './api';

export const PAGE_SIZE = 24;
const PHOTOS_KEY = ['photos', PAGE_SIZE];

/**
 * Infinite, paginated gallery feed. React Query caches pages, dedupes
 * in-flight requests, and only refetches when stale — so scrolling back up
 * costs nothing and we never hammer the backend.
 */
export function usePhotos(pageSize = PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: ['photos', pageSize],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await api.get('/photos', {
        params: { page: pageParam, pageSize },
        signal,
      });
      return data; // { data: PhotoDto[], meta: PaginationMeta }
    },
    getNextPageParam: (last) =>
      last?.meta?.hasNextPage ? last.meta.page + 1 : undefined,
    staleTime: 60_000,
  });
}

function buildForm(files, description) {
  const form = new FormData();
  if (Array.isArray(files)) {
    files.forEach((f) => form.append('files', f));
  } else {
    form.append('file', files);
  }
  if (description) form.append('description', description);
  return form;
}

/**
 * Upload one or many files. One file → POST /photos/upload; more → the bulk
 * endpoint. Reports byte-level progress via onProgress(0..100).
 */
export function useUpload(onProgress) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, description }) => {
      const many = files.length > 1;
      const endpoint = many ? '/photos/upload/bulk' : '/photos/upload';
      const payload = many ? buildForm(files, description) : buildForm(files[0], description);
      const { data } = await api.post(endpoint, payload, {
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      // Normalize single vs bulk into one shape.
      return many
        ? data
        : { createdCount: 1, failedCount: 0, created: [data], failed: [] };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PHOTOS_KEY }),
  });
}

/** Force the backend to re-sync the album index and drop cached URLs. */
export function useRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/photos/refresh')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: PHOTOS_KEY }),
  });
}
