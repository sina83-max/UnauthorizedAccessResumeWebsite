import type {
  PersonalData,
  BlogCategory,
  BlogPost,
  ResumeSection,
  Project,
} from "@/types/api";

// --- FileNode type (same shape as the existing one in App.tsx) ---

export type FileType = "folder" | "markdown" | "pdf" | "json" | "vcf" | "code";

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  date?: string;
  content?: string;
  category?: string;
  isRestricted?: boolean;
  children?: FileNode[];
  downloadName?: string;
}

// --- Helpers ---

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function estimateSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// --- Build individual file nodes ---

function buildResumePDF(settings: Record<string, string>): FileNode {
  const pdfUrl = settings["resume.pdf_url"] || "/api/storage?path=resume.pdf";
  return {
    id: "resume-pdf",
    name: "resume.pdf",
    type: "pdf",
    size: "—",
    date: "",
    content: pdfUrl,
    downloadName: "Resume.pdf",
  };
}

function buildResumeFile(section: ResumeSection): FileNode {
  const isJSON = section.key === "skills" || section.key === "resume";

  if (isJSON && section.content_json) {
    const pretty = JSON.stringify(section.content_json, null, 2);
    return {
      id: `resume-${section.key}`,
      name: `${section.key}.json`,
      type: "json",
      size: estimateSize(pretty),
      date: formatDate(section.updated_at),
      content: pretty,
    };
  }

  return {
    id: `resume-${section.key}`,
    name: `${section.key}.md`,
    type: "markdown",
    size: estimateSize(section.content_md || ""),
    date: formatDate(section.updated_at),
    content: section.content_md || "",
  };
}

function buildProjectFile(project: Project): FileNode {
  const parts = [`# ${project.title}\n`];
  if (project.description_md) parts.push(project.description_md);
  if (project.repo_url) parts.push(`\n**Repository:** ${project.repo_url}`);
  if (project.live_url) parts.push(`**Live:** ${project.live_url}`);

  const content = parts.join("\n");

  return {
    id: `project-${project.id}`,
    name: `${project.title.toLowerCase().replace(/\s+/g, "-")}.md`,
    type: "markdown",
    size: estimateSize(content),
    date: formatDate(project.updated_at),
    content,
  };
}

function buildContactVCF(settings: Record<string, string>): FileNode {
  const name = settings["contact.name"] || "Your Name";
  const email = settings["contact.email"] || "";
  const phone = settings["contact.phone"] || "";
  const location = settings["contact.location"] || "";
  const title = settings["contact.title"] || "";
  const github = settings["contact.github"] || "";
  const linkedin = settings["contact.linkedin"] || "";

  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    title ? `TITLE:${title}` : "",
    `EMAIL:${email}`,
    `TEL:${phone}`,
    `ADR:;;${location};;;;`,
    github ? `URL:${github}` : "",
    linkedin ? `X-SOCIALPROFILE;type=linkedin:${linkedin}` : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");

  return {
    id: "contact",
    name: "contact.vcf",
    type: "vcf",
    size: estimateSize(vcf),
    date: formatDate(new Date().toISOString()),
    content: vcf,
  };
}

function buildBlogPostFile(post: BlogPost): FileNode {
  return {
    id: `post-${post.id}`,
    name: `${post.slug}.md`,
    type: "markdown",
    size: estimateSize(post.content_md || ""),
    date: formatDate(post.published_at),
    content: post.content_md || "",
    category: post.category?.name || "Article",
  };
}

function buildCategoryFolder(
  category: BlogCategory,
  posts: BlogPost[]
): FileNode {
  return {
    id: `category-${category.id}`,
    name: category.name,
    type: "folder",
    children: posts
      .filter((p) => p.category_id === category.id)
      .map(buildBlogPostFile),
  };
}

// --- Main build function ---

export function buildFileSystem(
  personal: PersonalData,
  categories: BlogCategory[],
  posts: BlogPost[]
): FileNode {
  const personalChildren: FileNode[] = [];

  personalChildren.push(buildResumePDF(personal.settings));

  for (const section of personal.resume_sections) {
    personalChildren.push(buildResumeFile(section));
  }

  for (const project of personal.projects) {
    personalChildren.push(buildProjectFile(project));
  }

  personalChildren.push(buildContactVCF(personal.settings));

  const blogChildren = categories.map((cat) =>
    buildCategoryFolder(cat, posts)
  );

  return {
    id: "root",
    name: "Sina's Remote Mac",
    type: "folder",
    children: [
      {
        id: "personal",
        name: "Personal",
        type: "folder",
        children: personalChildren,
      },
      {
        id: "blog",
        name: "Blog",
        type: "folder",
        children: blogChildren,
      },
      {
        id: "system-root",
        name: "System Root",
        type: "folder",
        isRestricted: true,
        children: [],
      },
      {
        id: "network-trash",
        name: "Trash",
        type: "folder",
        isRestricted: true,
        children: [],
      },
    ],
  };
}
