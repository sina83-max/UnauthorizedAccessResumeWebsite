package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"portfolio-api/internal/config"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

// JWTAuth is middleware that validates the JWT token from the
// Authorization header. If valid, it adds the user_id to the
// request context so downstream handlers can access it.
//
// Usage in router:
//
//	r.Group(func(r chi.Router) {
//	    r.Use(middleware.JWTAuth)
//	    r.Get("/api/admin/something", handlers.AdminHandler)
//	})
func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract the auth header
		// Format: "Bearer etyuiopfghjkl..."
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		// strings.SplitN splits into at most 2 parts on " ".
		// "Bearer token123" → ["Bearer", "token123"]
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Invalid authorization format"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Parse and validate the JWT token.
		// The keyfunc receives the parsed token and returns the signing key.
		// We sign with HMAC (HS256), so the key is a []byte secret.
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate that the signing method is HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.C.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error": "invalid token"}`, http.StatusUnauthorized)
			return
		}

		// Extract claims from the validated token.
		// jwt.MapClaims is map[string]interface{} with helper methods.
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error": "Invalid claims"}`, http.StatusUnauthorized)
			return
		}

		// Get the user_id we stored in the token during the login
		// json.Number is how jwt represents number in mapclaims.
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, `{"error": "Invalid user_id in token"}`, http.StatusUnauthorized)
			return
		}

		// Convert float64 to uint (json num is float64)
		userID := uint(userIDFloat)

		// Add the user_id to the request context
		// context.withValue returns a new context with the value added
		// WE use a custom type key UserIDKey to avoid conflicts
		ctx := context.WithValue(r.Context(), UserIDKey, userID)

		// r.WithContext returns a shallow copy of r with the new context
		// The next handler in the chain receives this updated request
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
