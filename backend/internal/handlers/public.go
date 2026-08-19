package handlers

import (
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"net/http"
	"portfolio-api/internal/email"

	"portfolio-api/internal/database"
	"portfolio-api/internal/models"
)

// jsonResponse is a helper that writes a JSON response.
// It sets the Content-Type header and encodes the data.
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// GetPersonal returns everything the frontend needs for the Personal/ folder:
// resume sections, projects, and site settings (contact info, PDF URL, etc.)
//
// Response shape:
//
//	{
//	  "resume_sections": [...],
//	  "projects": [...],
//	  "settings": {"contact.name": "...", "resume.pdf_url": "...", ...}
//	}
func GetPersonal(w http.ResponseWriter, r *http.Request) {
	// Fetch all resume section for the personal part
	var sections []models.ResumeSection
	database.DB.Find(&sections)

	// Fetch all projects, order by sort_order
	var projects []models.Project
	database.DB.Order("sort_order ASC").Find(&projects)

	// Fetch all site settings and convert to map
	var settingsRows []models.SiteSetting
	database.DB.Find(&settingsRows)

	settingsMap := make(map[string]string)
	for _, s := range settingsRows {
		settingsMap[s.Key] = s.Value
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"resume_sections": sections,
		"projects":        projects,
		"settings":        settingsMap,
	})
}

func GetPostsByCategory(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	// Find the category by slug
	var category models.BlogCategory
	if err := database.DB.Where("slug = ?", slug).First(&category).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "category not found"})
		return
	}

	// Find all posts in this category (preloads the Category relation)
	var posts []models.BlogPost
	database.DB.Where("category_id = ?", category.ID).
		Preload("Category").
		Order("published_at DESC").
		Find(&posts)

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"category": category,
		"posts":    posts,
	})
}

func GetCategories(w http.ResponseWriter, r *http.Request) {
	var categories []models.BlogCategory
	database.DB.Find(&categories)

	jsonResponse(w, http.StatusOK, categories)
}

// GetPostBySlug returns a single blog post by its URL-friendly slug.
func GetPostBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	var post models.BlogPost
	if err := database.DB.Where("slug = ?", slug).
		Preload("Category").
		First(&post).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "post not found"})
		return
	}

	jsonResponse(w, http.StatusOK, post)
}

// CreateContactMessage handles the POST /api/contact endpoint.
// It saves the message to the database, then sends it to the
// email notifier channel (non-blocking goroutine pattern).
// Returns 202 Accepted (not 200) because the email send is async.
func CreateContactMessage(w http.ResponseWriter, r *http.Request) {
	// Decode JSON body into ContactMessage struct
	var msg models.ContactMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	// Basic validation
	if msg.Name == "" || msg.Email == "" || msg.Message == "" {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "name, email, and message are required"})
		return
	}

	// Save to database
	if err := database.DB.Create(&msg).Error; err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to save message"})
		return
	}

	// Send to email notifier goroutine (non-blocking)
	email.Enqueue(msg)

	jsonResponse(w, http.StatusAccepted, map[string]string{"status": "accepted"})
}
