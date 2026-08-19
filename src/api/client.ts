import type {
  PersonalData,
  BlogCategory,
  CategoryPostsResponse,
  BlogPost,
} from "@/types/api";

const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

// === PUBLIC ENDPOINTS ===

export function fetchPersonal(): Promise<PersonalData> {
  return apiFetch<PersonalData>("/personal");
}

export function fetchCategories(): Promise<BlogCategory[]> {
  return apiFetch<BlogCategory[]>("/blog/categories");
}

export function fetchPostsByCategory(
  slug: string
): Promise<CategoryPostsResponse> {
  return apiFetch<CategoryPostsResponse>(`/blog/categories/${slug}/posts`);
}

export function fetchPostBySlug(slug: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/blog/posts/${slug}`);
}

// === ADMIN ENDPOINTS ===

export function adminLogin(
  username: string,
  password: string
): Promise<{ token: string }> {
  return apiFetch<{ token: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function adminFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  return apiFetch<T>(`/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export function updateResumeSection(
  key: string,
  data: { title: string; content_md?: string; content_json?: unknown },
  token: string
) {
  return adminFetch(`/resume-sections/${key}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function createProject(data: unknown, token: string) {
  return adminFetch("/projects", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProject(id: number, data: unknown, token: string) {
  return adminFetch(`/projects/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: number, token: string) {
  return adminFetch(`/projects/${id}`, token, { method: "DELETE" });
}

export function createCategory(data: unknown, token: string) {
  return adminFetch("/blog/categories", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createPost(data: unknown, token: string) {
  return adminFetch("/blog/posts", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePost(id: number, data: unknown, token: string) {
  return adminFetch(`/blog/posts/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deletePost(id: number, token: string) {
  return adminFetch(`/blog/posts/${id}`, token, { method: "DELETE" });
}

export async function uploadFile(
  file: File,
  token: string
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
