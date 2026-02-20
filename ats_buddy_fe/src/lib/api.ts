// ATS Buddy UAE — API Client
// Centralized HTTP client with auth interceptor

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthTokens {
  access_token: string;
}

export interface RegisteredUser {
  user_id: number;
  full_name: string;
  email: string;
}

export interface ResumeExtractResult {
  file_name: string;
  file_type: 'pdf' | 'docx';
  extracted_text: string;
  character_count: number;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ATSCheckPayload {
  resume_text: string;
  job_description: string;
  target_role?: string;
  industry?: string;
}

export interface ATSCheckResult {
  overall_score: number;
  breakdown?: Record<string, number>;
  score_breakdown?: Record<string, number>;
  matched_keywords?: string[];
  missing_keywords?: string[];
  section_gaps?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}

export interface ResumeOptimizePayload {
  resume_text: string;
  job_description?: string;
  target_role?: string;
  preferred_emirate?: string;
}

export interface ResumeOptimizeResult {
  optimized_summary?: string;
  rewritten_bullets?: string[];
  skills_to_add?: string[];
  uae_localization_tips?: string[];
  [key: string]: unknown;
}

export interface KeywordGapPayload {
  resume_text: string;
  job_description: string;
}

export interface KeywordGapResult {
  missing_keywords?: string[];
  high_priority_keywords?: string[];
  coverage_percentage?: number;
  [key: string]: unknown;
}

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'ats_buddy_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = tokenStore.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const json = await response.json();

  if (!response.ok) {
    const message =
      json?.detail ||
      json?.message ||
      json?.error ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return json as T;
}

async function uploadRequest<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const json = await response.json();
  if (!response.ok) {
    const message =
      json?.detail ||
      json?.message ||
      json?.error ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return json as T;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const api = {
  health: () =>
    request<ApiResponse<{ status: string }>>('/api/v1/health'),

  auth: {
    register: (payload: RegisterPayload) =>
      request<ApiResponse<RegisteredUser>>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (payload: LoginPayload) =>
      request<ApiResponse<AuthTokens>>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  ats: {
    check: (payload: ATSCheckPayload) =>
      request<ApiResponse<ATSCheckResult>>('/api/v1/ats/check', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true),
  },

  resume: {
    extractText: (file: File) =>
      uploadRequest<ApiResponse<ResumeExtractResult>>('/api/v1/resume/extract-text', file),

    optimize: (payload: ResumeOptimizePayload) =>
      request<ApiResponse<ResumeOptimizeResult>>('/api/v1/resume/optimize', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true),

    keywordGap: (payload: KeywordGapPayload) =>
      request<ApiResponse<KeywordGapResult>>('/api/v1/resume/keyword-gap', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true),
  },
};
