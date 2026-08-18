package handlers

import (
	"github.com/google/uuid"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"portfolio-api/internal/config"
	"strings"
)

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".pdf":  true,
}

// UploadImage handles multipart file uploads.
// It saves the file with a UUID filename to prevent collisions
// and returns the URL path the frontend can use.
func UploadImage(w http.ResponseWriter, r *http.Request) {
	// ParseMultipartForm limits the total form size to 10MB.
	// This includes all form fields + file data.
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error": "no file provided"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if !allowedExtensions[ext] {
		http.Error(w, `{"error": "invalid file extension"}`, http.StatusBadRequest)
	}

	filename := uuid.New().String() + ext

	// upload directory check
	uploadDir := config.C.UploadDir
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		http.Error(w, `{"error": "could not create directory"}`, http.StatusInternalServerError)
		return
	}

	// create file
	dstpath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstpath)
	if err != nil {
		http.Error(w, `{"error": "could not create file"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy the content to destination file
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, `{"error": "could not save file"}`, http.StatusInternalServerError)
		return
	}

	// url for frontend
	jsonResponse(w, http.StatusOK, map[string]string{
		"url": "/uploads/" + filename,
	})
}

// ServeUploads returns an http.Handler that serves files from the uploads directory.
// chi's routing handles stripping the /uploads prefix before calling this handler.
func ServeUploads(uploadDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip the /uploads prefix to get the actual filename
		path := strings.TrimPrefix(r.URL.Path, "/uploads/")
		filePath := filepath.Join(uploadDir, path)

		// Check if file exists before serving
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filePath)
	})
}
