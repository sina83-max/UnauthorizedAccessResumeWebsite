package handlers

import (
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"gorm.io/datatypes"
	"net/http"
	"portfolio-api/internal/database"
	"portfolio-api/internal/models"
	"strconv"
)

// This helper extracts a url parameter and converts it to uint
// 0 & err if fails
func uintParam(w http.ResponseWriter, r *http.Request, param string) (uint, bool) {
	idStr := chi.URLParam(r, param)
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid " + param})
		return 0, false
	}
	return uint(id), true
}

// UpdateResumeSection updates (or creates) a resume section by its key.
// Uses upsert logic: try to find first, create if not found.
func UpdateResumeSection(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")

	// Define what fields can be updated
	var body struct {
		Title       string          `json:"title"`
		ContentMD   string          `json:"content_md"`
		ContentJSON json.RawMessage `json:"content_json"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	// Try to find existing section
	var section models.ResumeSection
	result := database.DB.Where("key = ?", key).First(&section)

	if result.Error != nil {
		// Not found — create new
		section = models.ResumeSection{
			Key:       key,
			Title:     body.Title,
			ContentMD: body.ContentMD,
		}
		if body.ContentJSON != nil {
			section.ContentJSON = datatypes.JSON(body.ContentJSON)
		}
		database.DB.Create(&section)
	} else {
		// Found — update fields
		section.Title = body.Title
		section.ContentMD = body.ContentMD
		if body.ContentJSON != nil {
			section.ContentJSON = datatypes.JSON(body.ContentJSON)
		}
		database.DB.Save(&section) // Save updates all fields
	}

	jsonResponse(w, http.StatusOK, section)
}

// CreateProject creates a new project.
func CreateProject(w http.ResponseWriter, r *http.Request) {
	var project models.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if err := database.DB.Create(&project).Error; err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to create project"})
		return
	}

	jsonResponse(w, http.StatusCreated, project)
}

// UpdateProject updates an existing project by ID.
func UpdateProject(w http.ResponseWriter, r *http.Request) {
	id, ok := uintParam(w, r, "id")
	if !ok {
		return
	}

	var existing models.Project
	if err := database.DB.First(&existing, id).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "project not found"})
		return
	}

	// Decode body into the existing record
	if err := json.NewDecoder(r.Body).Decode(&existing); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	database.DB.Save(&existing)
	jsonResponse(w, http.StatusOK, existing)
}

// DeleteProject hard-deletes a project by ID.
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	id, ok := uintParam(w, r, "id")
	if !ok {
		return
	}

	result := database.DB.Delete(&models.Project{}, id)
	if result.RowsAffected == 0 {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "project not found"})
		return
	}

	// 204 = "deleted successfully, no content to return"
	w.WriteHeader(http.StatusNoContent)
}

// CreateCategory creates a new blog category.
func CreateCategory(w http.ResponseWriter, r *http.Request) {
	var category models.BlogCategory
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if err := database.DB.Create(&category).Error; err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to create category (slug may not be unique)"})
		return
	}

	jsonResponse(w, http.StatusCreated, category)
}

// CreatePost creates a new blog post.
func CreatePost(w http.ResponseWriter, r *http.Request) {
	var post models.BlogPost
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if err := database.DB.Create(&post).Error; err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to create post"})
		return
	}

	jsonResponse(w, http.StatusCreated, post)
}

// UpdatePost updates an existing blog post by ID.
func UpdatePost(w http.ResponseWriter, r *http.Request) {
	id, ok := uintParam(w, r, "id")
	if !ok {
		return
	}

	var existing models.BlogPost
	if err := database.DB.First(&existing, id).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "post not found"})
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&existing); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	database.DB.Save(&existing)
	jsonResponse(w, http.StatusOK, existing)
}

// DeletePost soft-deletes a blog post by setting deleted_at.
// GORM's DB.Delete() on a model with gorm.DeletedAt sets the timestamp
// instead of actually DELETE-ing the row. All future queries automatically
// exclude soft-deleted records.
func DeletePost(w http.ResponseWriter, r *http.Request) {
	id, ok := uintParam(w, r, "id")
	if !ok {
		return
	}

	var post models.BlogPost
	if err := database.DB.First(&post, id).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "post not found"})
		return
	}

	database.DB.Delete(&post) // This sets deleted_at, doesn't DELETE the row
	w.WriteHeader(http.StatusNoContent)
}
