/** Photo record returned by the photos API. */
export interface PhotoDto {
  id: string;
  googlePhotoId: string;
  filename: string | null;
  description: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  baseUrl: string | null;
  rawUrl: string;
  creationTime: string | null;
  uploadedAt: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

export interface PagedPhotos {
  data: PhotoDto[];
  meta: PaginationMeta;
}

/** Uploader group built client-side from photos. */
export interface UploaderGroup {
  uploaderId: string | null;
  uploaderName: string;
  photos: PhotoDto[];
  lastUploadedAt: string | null;
}

export type AdmissionStatus = 'pending' | 'admitted';

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

/** Authenticated user stored in AuthContext. */
export interface AuthUser {
  id: string;
  sub?: string;
  email: string | null;
  name?: string;
  role: string;
  buttonEnabled: boolean;
  jti?: string;
}

/** Authentication context value. */
export interface AuthContextValue {
  user: AuthUser | null;
  status: 'checking' | 'authed' | 'guest';
  login: (email: string, password: string) => Promise<AuthUser>;
  guestLogin: (token: string) => Promise<AuthUser>;
  logout: () => void;
  isAdmin: boolean;
}

/** Single toast notification. */
export interface Toast {
  id: number;
  msg: string;
  tone: 'ok' | 'err' | 'info';
}

/** Toast context value. */
export interface ToastContextValue {
  toasts: Toast[];
  toast: {
    info: (msg: string, ttl?: number) => number;
    ok: (msg: string, ttl?: number) => number;
    err: (msg: string, ttl?: number) => number;
  };
  dismiss: (id: number) => void;
}

/** Upload result from the photos API. */
export interface UploadResult {
  createdCount: number;
  failedCount: number;
  created: PhotoDto[];
  failed: Array<{ reason?: string }>;
}
