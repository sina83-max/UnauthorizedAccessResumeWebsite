package database

import (
	"fmt"
	"log"
	"strings"

	"portfolio-api/internal/config"
	"portfolio-api/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB is the global database connection. Any file that imports
// database can use database.DB to run queries.
var DB *gorm.DB

func Connect(cfg *config.Config) error {
	var err error

	dsn := cfg.DBUrl
	if strings.Contains(dsn, "supabase") || strings.Contains(dsn, "pgbouncer") {
		if !strings.Contains(dsn, "pgbouncer") {
			if strings.Contains(dsn, "?") {
				dsn += "&pgbouncer=true"
			} else {
				dsn += "?pgbouncer=true"
			}
		}
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		PrepareStmt: false,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✓ Database connected successfully")
	return nil
}

func Migrate() error {
	err := DB.AutoMigrate(
		&models.ResumeSection{},
		&models.Project{},
		&models.BlogCategory{},
		&models.BlogPost{},
		&models.SiteSetting{},
		&models.AdminUser{},
		&models.ContactMessage{},
	)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			log.Println("⚠ Some tables already exist, continuing...")
			return nil
		}
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("✓ Database migration completed")
	return nil
}
