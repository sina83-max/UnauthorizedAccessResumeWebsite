// These interfaces mirror the Go models in backend/internal/models/models.go.
// The JSON tags on the Go structs determine the key names in the API responses.

export interface ResumeSection {
  id: number;
  key: string;
  title: string;
  content_md: string;
  content_json: Record<string, unknown> | null;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  description_md: string;
  repo_url: string;
  live_url: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: number;
  category_id: number;
  category?: BlogCategory;
  title: string;
  slug: string;
  content_md: string;
  cover_image: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Key-value map from site_settings table
// e.g. { "contact.name": "Sina", "contact.email": "..." }
export interface SiteSettings {
  [key: string]: string;
}

// Shape of GET /api/personal response
export interface PersonalData {
  resume_sections: ResumeSection[];
  projects: Project[];
  settings: SiteSettings;
}

// Shape of GET /api/blog/categories/{slug}/posts response
export interface CategoryPostsResponse {
  category: BlogCategory;
  posts: BlogPost[];
}
