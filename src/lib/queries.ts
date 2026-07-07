import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './api.ts';
import type { PagedPhotos, UploadResult } from '../types.ts';

export const PAGE_SIZE = 24;
const PHOTOS_KEY = ['photos', PAGE_SIZE] as const;

export function usePhotos(pageSize = PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: ['photos', pageSize] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }): Promise<PagedPhotos> => {
      const { data } = await api.get('/photos', {
        params: { page: pageParam, pageSize },
        signal,
      });
      return data as PagedPhotos;
    },
    getNextPageParam: (last: PagedPhotos) =>
      last?.meta?.hasNextPage ? last.meta.page + 1 : undefined,
    staleTime: 60_000,
  });
}

function buildForm(files: File | File[], description: string): FormData {
  const form = new FormData();
  if (Array.isArray(files)) {
    files.forEach((f) => form.append('files', f));
  } else {
    form.append('file', files);
  }
  if (description) form.append('description', description);
  return form;
}

export function useUpload(onProgress?: (progress: number) => void) {
  const qc = useQueryClient();
  return useMutation<UploadResult, Error, { files: File[]; description: string }>({
    mutationFn: async ({ files, description }): Promise<UploadResult> => {
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
      return many
        ? (data as UploadResult)
        : { createdCount: 1, failedCount: 0, created: [data], failed: [] };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PHOTOS_KEY }),
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/photos/refresh')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: PHOTOS_KEY }),
  });
}
