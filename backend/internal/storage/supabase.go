package storage

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"portfolio-api/internal/config"
	"time"
)

var client = &http.Client{Timeout: 30 * time.Second}

type bucketResp struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func apiURL(path string) string {
	return config.C.SupabaseURL + "/storage/v1" + path
}

func headers() map[string]string {
	return map[string]string{
		"apikey":        config.C.SupabaseKey,
		"Authorization": "Bearer " + config.C.SupabaseKey,
	}
}

// EnsureBucket creates the public uploads bucket if it doesn't exist.
func EnsureBucket() {
	if config.C.SupabaseURL == "" {
		log.Println("  → Supabase not configured, using local disk for uploads")
		return
	}

	req, _ := http.NewRequest("GET", apiURL("/bucket"), nil)
	for k, v := range headers() {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("  ⚠ Could not check Supabase buckets: %v", err)
		return
	}
	defer resp.Body.Close()

	var buckets []bucketResp
	json.NewDecoder(resp.Body).Decode(&buckets)

	for _, b := range buckets {
		if b.Name == config.C.SupabaseBucket {
			log.Printf("  → Bucket '%s' exists", config.C.SupabaseBucket)
			return
		}
	}

	body, _ := json.Marshal(map[string]interface{}{
		"id":             config.C.SupabaseBucket,
		"public":         true,
		"file_size_limit": 10485760,
	})

	req, _ = http.NewRequest("POST", apiURL("/bucket"), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers() {
		req.Header.Set(k, v)
	}

	resp2, err := client.Do(req)
	if err != nil {
		log.Printf("  ⚠ Could not create bucket: %v", err)
		return
	}
	defer resp2.Body.Close()

	if resp2.StatusCode == 200 || resp2.StatusCode == 409 {
		log.Printf("  → Bucket '%s' ready", config.C.SupabaseBucket)
	} else {
		b, _ := io.ReadAll(resp2.Body)
		log.Printf("  ⚠ Bucket creation failed (%d): %s", resp2.StatusCode, string(b))
	}
}

// UploadFile uploads data to Supabase Storage and returns a proxy URL path.
func UploadFile(filePath string, data []byte) (string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filePath)
	if err != nil {
		return "", err
	}
	part.Write(data)
	writer.Close()

	url := fmt.Sprintf("/object/%s/%s", config.C.SupabaseBucket, filePath)
	req, _ := http.NewRequest("POST", apiURL(url), body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("x-upsert", "true")
	for k, v := range headers() {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("upload failed (%d): %s", resp.StatusCode, string(b))
	}

	return "/api/storage?path=" + filePath, nil
}

// ProxyDownload fetches a file from Supabase and streams it to the response.
func ProxyDownload(w http.ResponseWriter, filePath string) {
	url := fmt.Sprintf("/object/public/%s/%s", config.C.SupabaseBucket, filePath)
	req, _ := http.NewRequest("GET", apiURL(url), nil)
	for k, v := range headers() {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Storage error", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	if cl := resp.Header.Get("Content-Length"); cl != "" {
		w.Header().Set("Content-Length", cl)
	}
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.WriteHeader(http.StatusOK)
	io.Copy(w, resp.Body)
}
