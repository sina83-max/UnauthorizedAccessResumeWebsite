package handlers

import (
	"encoding/json"
	"net/http"
	"portfolio-api/internal/database"
	"portfolio-api/internal/middleware"
	"portfolio-api/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.NewPassword == "" {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "new password is required"})
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok {
		jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var user models.AdminUser
	if err := database.DB.First(&user, userID).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "current password is incorrect"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to hash password"})
		return
	}

	database.DB.Model(&user).Update("password_hash", string(hash))
	jsonResponse(w, http.StatusOK, map[string]string{"message": "password updated"})
}

func getUserID(r *http.Request) (uint, bool) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	return userID, ok
}

func ListUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.AdminUser
	database.DB.Order("id").Find(&users)
	jsonResponse(w, http.StatusOK, users)
}

type createUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var req createUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Username == "" || req.Password == "" {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "username and password are required"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to hash password"})
		return
	}

	user := models.AdminUser{
		Username:     req.Username,
		PasswordHash: string(hash),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		jsonResponse(w, http.StatusConflict, map[string]string{"error": "username already exists"})
		return
	}

	jsonResponse(w, http.StatusCreated, user)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := uintParam(w, r, "id")
	if !ok {
		return
	}

	// Prevent deleting yourself
	if callerID, ok := getUserID(r); ok && callerID == id {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "cannot delete your own account"})
		return
	}

	// Prevent deleting the last admin
	var count int64
	database.DB.Model(&models.AdminUser{}).Count(&count)
	if count <= 1 {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "cannot delete the last admin user"})
		return
	}

	result := database.DB.Delete(&models.AdminUser{}, id)
	if result.RowsAffected == 0 {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type changePasswordByIDRequest struct {
	NewPassword string `json:"new_password"`
}

func ChangePasswordByID(w http.ResponseWriter, r *http.Request) {
	id, ok := uintParam(w, r, "id")
	if !ok {
		return
	}

	var req changePasswordByIDRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.NewPassword == "" {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "new password is required"})
		return
	}

	var user models.AdminUser
	if err := database.DB.First(&user, id).Error; err != nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "failed to hash password"})
		return
	}

	database.DB.Model(&user).Update("password_hash", string(hash))
	jsonResponse(w, http.StatusOK, map[string]string{"message": "password updated"})
}
