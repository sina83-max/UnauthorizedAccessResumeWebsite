package database

import (
	"fmt"
	"log"

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

	DB, err = gorm.Open(postgres.Open(cfg.DBUrl), &gorm.Config{})
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
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("✓ Database migration completed")
	return nil
}
