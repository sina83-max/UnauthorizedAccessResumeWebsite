package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"portfolio-api/internal/config"
	"portfolio-api/internal/storage"
	"strings"

	"github.com/google/uuid"
)

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".pdf":  true,
}

func UploadImage(w http.ResponseWriter, r *http.Request) {
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
		return
	}

	data, _ := io.ReadAll(file)

	if config.C.SupabaseURL != "" {
		filePath := "images/" + uuid.New().String() + ext
		url, err := storage.UploadFile(filePath, data)
		if err != nil {
			http.Error(w, `{"error": "upload failed"}`, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, http.StatusOK, map[string]string{"url": url})
		return
	}

	filename := uuid.New().String() + ext
	uploadDir := config.C.UploadDir
	os.MkdirAll(uploadDir, 0755)
	dstpath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstpath)
	if err != nil {
		http.Error(w, `{"error": "could not create file"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	dst.Write(data)

	jsonResponse(w, http.StatusOK, map[string]string{"url": "/uploads/" + filename})
}

func UploadResume(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error": "no file provided"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".pdf" {
		http.Error(w, `{"error": "only PDF files are allowed"}`, http.StatusBadRequest)
		return
	}

	data, _ := io.ReadAll(file)

	if config.C.SupabaseURL != "" {
		url, err := storage.UploadFile("resume.pdf", data)
		if err != nil {
			http.Error(w, `{"error": "upload failed"}`, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, http.StatusOK, map[string]string{"url": url})
		return
	}

	uploadDir := config.C.UploadDir
	os.MkdirAll(uploadDir, 0755)
	dstPath := filepath.Join(uploadDir, "resume.pdf")
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, `{"error": "could not create file"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	dst.Write(data)

	jsonResponse(w, http.StatusOK, map[string]string{"url": "/uploads/resume.pdf"})
}

func ServeUploads(uploadDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/uploads/")
		filePath := filepath.Join(uploadDir, path)

		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filePath)
	})
}
