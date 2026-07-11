/** Photo record returned by GET /photos and GET /photos/moderation. */
export interface PhotoDto {
  id: string;
  filename: string | null;
  description: string | null;
  mimeType: string | null;
  width?: number;
  height?: number;
  baseUrl?: string;
  thumbnailUrl?: string;
  displayUrl?: string;
  downloadUrl?: string;
  rawUrl: string;
  creationTime: string | null;
  uploadedAt: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  /** New field per docs/BACKEND_IMPLEMENTATION_SPEC.md §2.4 — 'guest' | 'couple'. */
  source: "guest" | "couple";
  /** Present only on GET /photos/moderation responses. */
  status?: "pending" | "approved" | "rejected";
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PagedPhotos {
  data: PhotoDto[];
  meta: PaginationMeta;
}

export interface UploadResult {
  createdCount: number;
  failedCount: number;
  created: PhotoDto[];
  failed: Array<{ filename?: string; reason?: string }>;
}

export type AdmissionStatus = "pending" | "admitted";

/** Guest info returned by POST /auth/guest-info. */
export interface GuestInfo {
  id: string;
  name?: string;
  role: string;
  admissionStatus: AdmissionStatus;
  admittedAt: string | null;
  avatarUrl: string | null;
}

/** Full user record returned by GET /users and GET /users/:id. */
export interface UserDto {
  id: string;
  name?: string;
  email: string | null;
  role: string;
  isActive: boolean;
  guestToken: string | null;
  buttonEnabled: boolean;
  admissionStatus: AdmissionStatus;
  admittedAt: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** Authenticated user, decoded from GET /auth/me or a login response. */
export interface AuthUser {
  id: string;
  sub?: string;
  email: string | null;
  name?: string;
  role: "guest" | "admin" | "super_admin";
  buttonEnabled: boolean;
  jti?: string;
}
