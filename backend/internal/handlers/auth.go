package handlers

import (
	"encoding/json"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"portfolio-api/internal/config"
	"portfolio-api/internal/database"
	"portfolio-api/internal/models"
	"time"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse is the JSON response on successful login
type loginResponse struct {
	Token string `json:"token"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	// Find the Admin user by username
	var user models.AdminUser
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "invalid username or password"})
		return
	}

	// Compare the password with the stored has
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {
		jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "invalid username or password"})
		return
	}

	// Generate JWT Token
	token, err := generateToken(user.ID)
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Failed to generate token"})
	}

	jsonResponse(w, http.StatusOK, loginResponse{Token: token})
}

func generateToken(userID uint) (string, error) {
	// jwt.MapClaims is a map[string]interface{} that satisfies the Claims interface.
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
		"iat":     time.Now().Unix(), // issued_at
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret key
	// secret is []byte - jwt work with this not string
	return token.SignedString([]byte(config.C.JWTSecret))
}
