package handlers

import (
	"net/http"
	"portfolio-api/internal/storage"
)

// ProxyStorage serves files from Supabase Storage.
// GET /api/storage?path=resume.pdf
func ProxyStorage(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		http.Error(w, `{"error": "missing path parameter"}`, http.StatusBadRequest)
		return
	}
	storage.ProxyDownload(w, path)
}
