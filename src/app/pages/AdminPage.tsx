import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  KeyRound,
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  Plus,
  Pencil,
  FileText,
  FolderKanban,
  Tags,
  BookOpen,
  Upload,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { format } from "date-fns";
import {
  adminLogin,
  adminListResumeSections,
  adminListProjects,
  adminListCategories,
  adminListPosts,
  updateResumeSection,
  deleteResumeSection,
  createProject,
  updateProject,
  deleteProject,
  createCategory,
  deleteCategory,
  createPost,
  updatePost,
  deletePost,
  uploadFile,
  uploadResume,
} from "@/api/client";
import type {
  ResumeSection,
  Project,
  BlogCategory,
  BlogPost,
} from "@/types/api";

// ─── Toast helper ────────────────────────────────────────────────────────────

type ToastKind = "success" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let toastSeq = 0;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const navigate = useNavigate();

  // ── Auth state ───────────────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Data state ───────────────────────────────────────────────────────────
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Editing state ────────────────────────────────────────────────────────
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────
  const [sectionForm, setSectionForm] = useState({ title: "", content_md: "", content_json: "" });
  const [projectForm, setProjectForm] = useState({
    title: "",
    description_md: "",
    repo_url: "",
    live_url: "",
    image_url: "",
    sort_order: 0,
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const [postForm, setPostForm] = useState({
    category_id: 0,
    title: "",
    slug: "",
    content_md: "",
  });

  // ── Toasts ───────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Resume upload ──────────────────────────────────────────────────────
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Login handler ────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await adminLogin(loginUser, loginPass);
      localStorage.setItem("admin_token", res.token);
      setToken(res.token);
      addToast("success", "Authenticated successfully");
    } catch {
      setLoginError("Invalid credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Fetch all data after login ───────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [secs, projs, cats, posts] = await Promise.all([
          adminListResumeSections(token),
          adminListProjects(token),
          adminListCategories(token),
          adminListPosts(token),
        ]);
        if (cancelled) return;
        setSections(secs);
        setProjects(projs);
        setCategories(cats);
        setPosts(posts);
      } catch (err) {
        addToast("error", "Failed to load data");
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, addToast]);

  // ── Resume section save ──────────────────────────────────────────────────
  const saveSection = async (key: string) => {
    try {
      const payload: { title: string; content_md?: string; content_json?: unknown } = {
        title: sectionForm.title,
      };
      if (sectionForm.content_md) payload.content_md = sectionForm.content_md;
      if (sectionForm.content_json.trim()) {
        try {
          payload.content_json = JSON.parse(sectionForm.content_json);
        } catch {
          addToast("error", "Invalid JSON in content_json");
          return;
        }
      }
      await updateResumeSection(key, payload, token!);
      setSections((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, title: sectionForm.title, content_md: sectionForm.content_md } : s
        )
      );
      setEditingSectionKey(null);
      addToast("success", `Section "${key}" updated`);
    } catch (err) {
      addToast("error", "Failed to save section");
      console.error(err);
    }
  };

  const handleDeleteSection = async (key: string) => {
    if (!window.confirm(`Delete section "${key}"?`)) return;
    try {
      await deleteResumeSection(key, token!);
      setSections((prev) => prev.filter((s) => s.key !== key));
      addToast("success", `Section "${key}" deleted`);
    } catch (err) {
      addToast("error", "Failed to delete section");
      console.error(err);
    }
  };

  // ── Project CRUD ─────────────────────────────────────────────────────────
  const resetProjectForm = () =>
    setProjectForm({ title: "", description_md: "", repo_url: "", live_url: "", image_url: "", sort_order: 0 });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject(projectForm, token!);
      // Reload
      const projs = await adminListProjects(token!);
      setProjects(projs);
      resetProjectForm();
      addToast("success", "Project created");
    } catch (err) {
      addToast("error", "Failed to create project");
      console.error(err);
    }
  };

  const handleUpdateProject = async (id: number) => {
    try {
      await updateProject(id, projectForm, token!);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...projectForm } : p))
      );
      setEditingProjectId(null);
      addToast("success", "Project updated");
    } catch (err) {
      addToast("error", "Failed to update project");
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteProject(id, token!);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      addToast("success", "Project deleted");
    } catch (err) {
      addToast("error", "Failed to delete project");
      console.error(err);
    }
  };

  // ── Category create ──────────────────────────────────────────────────────
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(categoryForm, token!);
      const cats = await adminListCategories(token!);
      setCategories(cats);
      setCategoryForm({ name: "", slug: "" });
      addToast("success", "Category created");
    } catch (err) {
      addToast("error", "Failed to create category");
      console.error(err);
    }
  };

  // ── Post CRUD ────────────────────────────────────────────────────────────
  const resetPostForm = () =>
    setPostForm({ category_id: categories[0]?.id ?? 0, title: "", slug: "", content_md: "" });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPost(postForm, token!);
      // Reload posts
      const posts = await adminListPosts(token!);
      setPosts(posts);
      resetPostForm();
      addToast("success", "Post created");
    } catch (err) {
      addToast("error", "Failed to create post");
      console.error(err);
    }
  };

  const handleUpdatePost = async (id: number) => {
    try {
      await updatePost(id, postForm, token!);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...postForm, category: categories.find((c) => c.id === postForm.category_id) } : p
        )
      );
      setEditingPostId(null);
      addToast("success", "Post updated");
    } catch (err) {
      addToast("error", "Failed to update post");
      console.error(err);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(id, token!);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast("success", "Post deleted");
    } catch (err) {
      addToast("error", "Failed to delete post");
      console.error(err);
    }
  };

  // ── File upload helper ───────────────────────────────────────────────────
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const res = await uploadFile(file, token!);
      addToast("success", "File uploaded");
      return res.url;
    } catch (err) {
      addToast("error", "Upload failed");
      console.error(err);
      return null;
    }
  };

  // ── Resume upload ─────────────────────────────────────────────────────
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      addToast("error", "Only PDF files are allowed");
      return;
    }
    setResumeUploading(true);
    try {
      await uploadResume(file, token!);
      setResumeFileName(file.name);
      addToast("success", "Resume uploaded successfully");
    } catch (err) {
      addToast("error", "Resume upload failed");
      console.error(err);
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="relative z-10 w-full max-w-lg bg-card/85 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Admin Login
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Authentication required to access the dashboard
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Username
                </Label>
                <Input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="admin"
                  required
                  className="rounded-xl bg-secondary/60 border-border/80 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="rounded-xl bg-secondary/60 border-border/80 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/30 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-xs text-muted-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Finder
                </Button>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="px-6 text-xs font-semibold shadow-lg shadow-primary/25"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Toasts */}
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">

      {/* Top bar */}
      <header className="relative z-10 h-14 bg-card/60 backdrop-blur-xl border-b border-border/40 px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold tracking-tight">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Finder
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("admin_token");
              setToken(null);
              setLoginUser("");
              setLoginPass("");
              addToast("success", "Logged out");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Loading data...</span>
          </div>
        ) : (
          <Tabs defaultValue="sections" className="space-y-6">
            <TabsList className="bg-card/60 backdrop-blur-xl border border-white/10">
              <TabsTrigger value="sections" className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" />
                Resume Sections
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-1.5 text-xs">
                <FolderKanban className="w-3.5 h-3.5" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-1.5 text-xs">
                <Tags className="w-3.5 h-3.5" />
                Blog Categories
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" />
                Blog Posts
              </TabsTrigger>
            </TabsList>

            {/* ─── RESUME SECTIONS TAB ─────────────────────────────────── */}
            <TabsContent value="sections">
              {/* ── Resume PDF Upload ──────────────────────────────── */}
              <Card className="bg-card/60 backdrop-blur-xl border border-white/10 mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Resume PDF
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Upload your resume PDF. This file is shown in the Finder and available for download.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleResumeUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resumeUploading}
                      onClick={() => resumeInputRef.current?.click()}
                      className="gap-1.5 text-xs"
                    >
                      {resumeUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {resumeUploading ? "Uploading…" : "Upload PDF"}
                    </Button>
                    {resumeFileName && (
                      <span className="text-xs text-muted-foreground font-mono">{resumeFileName}</span>
                    )}
                    <a
                      href="/uploads/resume.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View current
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Resume Sections</CardTitle>
                  <CardDescription className="text-xs">
                    Edit the content of each resume section. Changes are saved immediately.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sections.length === 0 && (
                    <p className="text-xs text-muted-foreground">No sections found.</p>
                  )}
                  {sections.map((section) => {
                    const isEditing = editingSectionKey === section.key;
                    return (
                      <div
                        key={section.key}
                        className="rounded-xl border border-border/40 bg-secondary/30 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase">
                              {section.key}
                            </span>
                            <span className="text-sm font-medium">{section.title}</span>
                          </div>
                          {!isEditing && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSectionKey(section.key);
                                  setSectionForm({
                                    title: section.title,
                                    content_md: section.content_md,
                                    content_json: section.content_json
                                      ? JSON.stringify(section.content_json, null, 2)
                                      : "",
                                  });
                                }}
                                className="text-xs gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSection(section.key)}
                                className="text-xs gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <div className="space-y-3 pt-2 border-t border-border/30">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Title</Label>
                              <Input
                                value={sectionForm.title}
                                onChange={(e) =>
                                  setSectionForm((p) => ({ ...p, title: e.target.value }))
                                }
                                className="text-sm bg-secondary/60"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Content (Markdown)
                              </Label>
                              <Textarea
                                value={sectionForm.content_md}
                                onChange={(e) =>
                                  setSectionForm((p) => ({ ...p, content_md: e.target.value }))
                                }
                                rows={6}
                                className="text-sm font-mono bg-secondary/60"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Content JSON{" "}
                                <span className="text-muted-foreground/60">(optional)</span>
                              </Label>
                              <Textarea
                                value={sectionForm.content_json}
                                onChange={(e) =>
                                  setSectionForm((p) => ({ ...p, content_json: e.target.value }))
                                }
                                rows={4}
                                placeholder='{ "key": "value" }'
                                className="text-sm font-mono bg-secondary/60"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveSection(section.key)}
                                className="text-xs gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSectionKey(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PROJECTS TAB ────────────────────────────────────────── */}
            <TabsContent value="projects">
              <div className="space-y-6">
                {/* Create form */}
                <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      New Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        label="Title"
                        value={projectForm.title}
                        onChange={(v) => setProjectForm((p) => ({ ...p, title: v }))}
                        required
                      />
                      <FormField
                        label="Sort Order"
                        type="number"
                        value={String(projectForm.sort_order)}
                        onChange={(v) =>
                          setProjectForm((p) => ({ ...p, sort_order: parseInt(v) || 0 }))
                        }
                      />
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Description (Markdown)</Label>
                        <Textarea
                          value={projectForm.description_md}
                          onChange={(e) =>
                            setProjectForm((p) => ({ ...p, description_md: e.target.value }))
                          }
                          rows={3}
                          className="text-sm font-mono bg-secondary/60"
                        />
                      </div>
                      <FormField
                        label="Repo URL"
                        value={projectForm.repo_url}
                        onChange={(v) => setProjectForm((p) => ({ ...p, repo_url: v }))}
                      />
                      <FormField
                        label="Live URL"
                        value={projectForm.live_url}
                        onChange={(v) => setProjectForm((p) => ({ ...p, live_url: v }))}
                      />
                      <FormField
                        label="Image URL"
                        value={projectForm.image_url}
                        onChange={(v) => setProjectForm((p) => ({ ...p, image_url: v }))}
                      />
                      <div className="flex items-end">
                        <Button type="submit" size="sm" className="text-xs gap-1">
                          <Plus className="w-3 h-3" />
                          Create Project
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      All Projects ({projects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40">
                          <TableHead className="text-xs">Title</TableHead>
                          <TableHead className="text-xs">Order</TableHead>
                          <TableHead className="text-xs">Repo</TableHead>
                          <TableHead className="text-xs">Live</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => {
                          const isEditing = editingProjectId === project.id;
                          if (isEditing) {
                            return (
                              <TableRow key={project.id} className="border-border/40">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="p-4 space-y-3 bg-secondary/30">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <FormField
                                        label="Title"
                                        value={projectForm.title}
                                        onChange={(v) =>
                                          setProjectForm((p) => ({ ...p, title: v }))
                                        }
                                      />
                                      <FormField
                                        label="Sort Order"
                                        type="number"
                                        value={String(projectForm.sort_order)}
                                        onChange={(v) =>
                                          setProjectForm((p) => ({
                                            ...p,
                                            sort_order: parseInt(v) || 0,
                                          }))
                                        }
                                      />
                                      <div className="sm:col-span-2 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">
                                          Description (Markdown)
                                        </Label>
                                        <Textarea
                                          value={projectForm.description_md}
                                          onChange={(e) =>
                                            setProjectForm((p) => ({
                                              ...p,
                                              description_md: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                          className="text-sm font-mono bg-secondary/60"
                                        />
                                      </div>
                                      <FormField
                                        label="Repo URL"
                                        value={projectForm.repo_url}
                                        onChange={(v) =>
                                          setProjectForm((p) => ({ ...p, repo_url: v }))
                                        }
                                      />
                                      <FormField
                                        label="Live URL"
                                        value={projectForm.live_url}
                                        onChange={(v) =>
                                          setProjectForm((p) => ({ ...p, live_url: v }))
                                        }
                                      />
                                      <FormField
                                        label="Image URL"
                                        value={projectForm.image_url}
                                        onChange={(v) =>
                                          setProjectForm((p) => ({ ...p, image_url: v }))
                                        }
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateProject(project.id)}
                                        className="text-xs gap-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingProjectId(null)}
                                        className="text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return (
                            <TableRow key={project.id} className="border-border/40">
                              <TableCell className="text-sm font-medium">
                                {project.title}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {project.sort_order}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {project.repo_url || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {project.live_url || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setEditingProjectId(project.id);
                                      setProjectForm({
                                        title: project.title,
                                        description_md: project.description_md,
                                        repo_url: project.repo_url,
                                        live_url: project.live_url,
                                        image_url: project.image_url,
                                        sort_order: project.sort_order,
                                      });
                                    }}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteProject(project.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {projects.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                              No projects yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── BLOG CATEGORIES TAB ─────────────────────────────────── */}
            <TabsContent value="categories">
              <div className="space-y-6">
                <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      New Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCategory} className="flex items-end gap-3 flex-wrap">
                      <FormField
                        label="Name"
                        value={categoryForm.name}
                        onChange={(v) => setCategoryForm((p) => ({ ...p, name: v }))}
                        required
                        className="flex-1 min-w-[180px]"
                      />
                      <FormField
                        label="Slug"
                        value={categoryForm.slug}
                        onChange={(v) => setCategoryForm((p) => ({ ...p, slug: v }))}
                        required
                        className="flex-1 min-w-[180px]"
                      />
                      <Button type="submit" size="sm" className="text-xs gap-1">
                        <Plus className="w-3 h-3" />
                        Create
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      All Categories ({categories.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40">
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Slug</TableHead>
                          <TableHead className="text-xs">Posts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((cat) => (
                          <TableRow key={cat.id} className="border-border/40">
                            <TableCell className="text-sm font-medium">{cat.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {cat.slug}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {posts.filter((p) => p.category_id === cat.id).length}
                            </TableCell>
                          </TableRow>
                        ))}
                        {categories.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">
                              No categories yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── BLOG POSTS TAB ──────────────────────────────────────── */}
            <TabsContent value="posts">
              <div className="space-y-6">
                {/* Create form */}
                <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      New Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <Select
                            value={String(postForm.category_id)}
                            onValueChange={(v) =>
                              setPostForm((p) => ({ ...p, category_id: parseInt(v) }))
                            }
                          >
                            <SelectTrigger className="text-sm bg-secondary/60">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormField
                          label="Title"
                          value={postForm.title}
                          onChange={(v) => setPostForm((p) => ({ ...p, title: v }))}
                          required
                        />
                        <FormField
                          label="Slug"
                          value={postForm.slug}
                          onChange={(v) => setPostForm((p) => ({ ...p, slug: v }))}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Content (Markdown)</Label>
                        <Textarea
                          value={postForm.content_md}
                          onChange={(e) =>
                            setPostForm((p) => ({ ...p, content_md: e.target.value }))
                          }
                          rows={8}
                          className="text-sm font-mono bg-secondary/60"
                        />
                      </div>
                      <Button type="submit" size="sm" className="text-xs gap-1">
                        <Plus className="w-3 h-3" />
                        Create Post
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="bg-card/60 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      All Posts ({posts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40">
                          <TableHead className="text-xs">Title</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs">Published</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => {
                          const isEditing = editingPostId === post.id;
                          const catName =
                            categories.find((c) => c.id === post.category_id)?.name ?? "—";
                          if (isEditing) {
                            return (
                              <TableRow key={post.id} className="border-border/40">
                                <TableCell colSpan={4} className="p-0">
                                  <div className="p-4 space-y-3 bg-secondary/30">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">
                                          Category
                                        </Label>
                                        <Select
                                          value={String(postForm.category_id)}
                                          onValueChange={(v) =>
                                            setPostForm((p) => ({
                                              ...p,
                                              category_id: parseInt(v),
                                            }))
                                          }
                                        >
                                          <SelectTrigger className="text-sm bg-secondary/60">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {categories.map((cat) => (
                                              <SelectItem
                                                key={cat.id}
                                                value={String(cat.id)}
                                              >
                                                {cat.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <FormField
                                        label="Title"
                                        value={postForm.title}
                                        onChange={(v) =>
                                          setPostForm((p) => ({ ...p, title: v }))
                                        }
                                      />
                                      <FormField
                                        label="Slug"
                                        value={postForm.slug}
                                        onChange={(v) =>
                                          setPostForm((p) => ({ ...p, slug: v }))
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs text-muted-foreground">
                                        Content (Markdown)
                                      </Label>
                                      <Textarea
                                        value={postForm.content_md}
                                        onChange={(e) =>
                                          setPostForm((p) => ({
                                            ...p,
                                            content_md: e.target.value,
                                          }))
                                        }
                                        rows={6}
                                        className="text-sm font-mono bg-secondary/60"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdatePost(post.id)}
                                        className="text-xs gap-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingPostId(null)}
                                        className="text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return (
                            <TableRow key={post.id} className="border-border/40">
                              <TableCell className="text-sm font-medium">
                                {post.title}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {catName}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {post.published_at
                                  ? format(new Date(post.published_at), "MMM d, yyyy")
                                  : "Draft"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setEditingPostId(post.id);
                                      setPostForm({
                                        category_id: post.category_id,
                                        title: post.title,
                                        slug: post.slug,
                                        content_md: post.content_md,
                                      });
                                    }}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {posts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                              No posts yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="text-sm bg-secondary/60"
      />
    </div>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium shadow-2xl backdrop-blur-xl border animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            t.kind === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-destructive/15 border-destructive/30 text-destructive"
          }`}
        >
          {t.kind === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {t.message}
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
