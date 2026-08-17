package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUrl         string
	JWTSecret     string
	Port          string
	UploadDir     string
	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPass      string
	AdminUsername string
	AdminPassword string
}

// C is the global config instance. After calling Load(), you can access
// any config value anywhere in the app as config.C.DBUrl, config.C.Port, et
var C *Config

func Load() *Config {
	godotenv.Load()

	C = &Config{
		// os.Getenv returns "" if the key doesn't exist.
		// The second argument is the fallback default.
		DBUrl:         getEnv("DB_URL", "postgres://postgres:devpassword@localhost:5432/portfolio?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		Port:          getEnv("PORT", "8080"),
		UploadDir:     getEnv("UPLOAD_DIR", "uploads"),
		SMTPHost:      getEnv("SMTP_HOST", ""),
		SMTPPort:      getEnv("SMTP_PORT", ""),
		SMTPUser:      getEnv("SMTP_USER", ""),
		SMTPPass:      getEnv("SMTP_PASS", ""),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "changeme"),
	}

	return C
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
