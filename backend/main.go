package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"portfolio-api/internal/config"
	"portfolio-api/internal/database"
	"portfolio-api/internal/email"
	"portfolio-api/internal/handlers"
	chiMiddleware "portfolio-api/internal/middleware"
	"portfolio-api/internal/storage"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

//go:embed static/*
var staticFiles embed.FS

func main() {
	// Check for -seed flag (e.g., "go run . -seed")
	seedFlag := flag.Bool("seed", false, "Seed the database with initial data")
	flag.Parse()

	// Load configuration from .env
	config.Load()

	// Connect to PostgreSQL
	if err := database.Connect(config.C); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	// ^ log.Fatalf prints the error and exits the program immediately.

	// Run database migrations (create/update tables)
	if err := database.Migrate(); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// If -seed flag was passed, seed and exit
	if *seedFlag {
		database.Seed()
		return
	}

	// Initialize the email notifier goroutine
	email.Init()

	// Create uploads directory if it doesn't exist
	os.MkdirAll(config.C.UploadDir, 0755)

	// Ensure Supabase Storage bucket exists (no-op if Supabase not configured)
	storage.EnsureBucket()

	// Build the router
	r := chi.NewRouter()

	// Global middleware
	// chi.Logger logs each request (method, path, status, latency)
	// chi.Recoverer catches panics and returns 500 instead of crashing
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS middleware (allows frontend dev server to call the API)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// === PUBLIC ROUTES (no auth required) ===
	r.Get("/api/personal", handlers.GetPersonal)
	r.Get("/api/blog/categories", handlers.GetCategories)
	r.Get("/api/blog/categories/{slug}/posts", handlers.GetPostsByCategory)
	r.Get("/api/blog/posts/{slug}", handlers.GetPostBySlug)
	r.Post("/api/contact", handlers.CreateContactMessage)

	// === ADMIN AUTH (no token required) ===
	r.Post("/api/admin/login", handlers.Login)

	// === ADMIN ROUTES (JWT required) ===
	r.Group(func(r chi.Router) {
		r.Use(chiMiddleware.JWTAuth)

		r.Get("/api/admin/resume-sections", handlers.ListResumeSections)
		r.Put("/api/admin/resume-sections/{key}", handlers.UpdateResumeSection)
		r.Delete("/api/admin/resume-sections/{key}", handlers.DeleteResumeSection)
		r.Get("/api/admin/projects", handlers.ListProjects)
		r.Post("/api/admin/projects", handlers.CreateProject)
		r.Put("/api/admin/projects/{id}", handlers.UpdateProject)
		r.Delete("/api/admin/projects/{id}", handlers.DeleteProject)
		r.Get("/api/admin/blog/categories", handlers.ListCategories)
		r.Post("/api/admin/blog/categories", handlers.CreateCategory)
		r.Delete("/api/admin/blog/categories/{id}", handlers.DeleteCategory)
		r.Get("/api/admin/blog/posts", handlers.ListPosts)
		r.Post("/api/admin/blog/posts", handlers.CreatePost)
		r.Put("/api/admin/blog/posts/{id}", handlers.UpdatePost)
		r.Delete("/api/admin/blog/posts/{id}", handlers.DeletePost)
		r.Post("/api/admin/upload", handlers.UploadImage)
		r.Post("/api/admin/upload-resume", handlers.UploadResume)
	})

	// === STATIC FILE SERVING ===
	// Proxy files from Supabase Storage
	r.Get("/api/storage", handlers.ProxyStorage)

	// Serve uploaded files (images, PDFs)
	r.Handle("/uploads/*", handlers.ServeUploads(config.C.UploadDir))

	// Serve the embedded frontend (built Vite app)
	// For now, this serves the static/ directory if it exists.
	// After building the frontend (pnpm build), the dist/ output
	// gets copied to static/ and embedded into the Go binary.
	setupFrontendServing(r)

	// Start the HTTP server
	addr := ":" + config.C.Port
	log.Printf("✓ Server starting on http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
	// ^ log.Fatal wraps ListenAndServe — it logs the error and exits.
	// ListenAndServe blocks until the server stops.
}

// setupFrontendServing serves the embedded frontend static files.
// It strips the "static/" prefix so files are served from root.
func setupFrontendServing(r chi.Router) {
	// fs.Sub extracts a subdirectory from the embedded FS
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Println("⚠ static/ directory not found — frontend won't be served")
		log.Println("  Build frontend with 'cd ../frontend && pnpm build' first")
		return
	}

	// http.FileServer serves files from the FS at the root URL
	fileServer := http.FileServer(http.FS(staticFS))

	r.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
		// For API routes and uploads, skip — let other handlers handle them
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/uploads/") {
			http.NotFound(w, r)
			return
		}

		// Try to serve the file. If it doesn't exist (SPA routing),
		// serve index.html so React Router can handle the path.
		f, err := staticFS.Open(strings.TrimPrefix(r.URL.Path, "/"))
		if err != nil {
			r.URL.Path = "/"
		} else {
			f.Close()
		}
		fileServer.ServeHTTP(w, r)
	})
}
