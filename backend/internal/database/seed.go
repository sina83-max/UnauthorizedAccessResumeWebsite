package database

import (
	"encoding/json"
	"log"
	"time"

	"portfolio-api/internal/config"
	"portfolio-api/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
)

// Seed populate the db with initial data
func Seed() {
	seedAdmin()
	seedResumeSections()
	seedSiteSettings()
	seedBlogCategories()
	seedBlogPosts()
	log.Println("✓ Seed completed")
}

func seedAdmin() {
	// Check if Admin already exists
	var count int64
	DB.Model(&models.AdminUser{}).Count(&count)
	if count > 0 {
		log.Println("  → Admin user already exists, skipping")
		return
	}

	// Hash the password with bcrypt
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(config.C.AdminPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Printf("  ✗ Failed to hash admin password: %v", err)
		return
	}

	admin := models.AdminUser{
		Username:     config.C.AdminUsername,
		PasswordHash: string(hash),
	}
	DB.Create(&admin)
	log.Println("  → Admin user created")
}

func seedResumeSections() {
	var count int64
	DB.Model(&models.ResumeSection{}).Count(&count)
	if count > 0 {
		log.Println("  → Resume sections already exist, skipping")
		return
	}

	sections := []models.ResumeSection{
		{
			Key:       "about",
			Title:     "About",
			ContentMD: "# About\n\nYour bio goes here. Replace this with your real content.",
		},
		{
			Key:       "experience",
			Title:     "Experience",
			ContentMD: "# Experience\n\n## Your Job Title @ Company\n2023 - Present\n\nDescribe your role and achievements.",
		},
		{
			Key: "skills",
			// ContentJSON needs to be marshaled from a Go map to JSON bytes.
			// datatypes.JSON is just []byte under the hood.
			Title: "Skills",
			ContentJSON: mustMarshal(map[string]interface{}{
				"frontend": []string{"React", "TypeScript", "Tailwind CSS"},
				"backend":  []string{"Go", "PostgreSQL", "Docker"},
			}),
		},
		{
			Key: "resume",
			// Store the PDF URL as JSON — the frontend reads pdf_url
			// and renders a download link / PDF preview.
			Title: "Resume",
			ContentJSON: mustMarshal(map[string]string{
				"pdf_url": "/uploads/resume.pdf",
			}),
		},
	}

	for _, s := range sections {
		DB.Create(&s)
	}
	log.Println("  → Resume sections seeded")
}

func seedSiteSettings() {
	var count int64
	DB.Model(&models.SiteSetting{}).Count(&count)
	if count > 0 {
		log.Println("  → Site settings already exist, skipping")
		return
	}

	settings := []models.SiteSetting{
		{Key: "contact.name", Value: "Sina Beignazari"},
		{Key: "contact.email", Value: "s.beignazary1383@gmail.com"},
		{Key: "contact.phone", Value: "+98 933 828 5859"},
		{Key: "contact.location", Value: "Iran, Tehran"},
	}

	for _, s := range settings {
		DB.Create(&s)
	}
	log.Println("  → Site settings seeded")
}

func seedBlogCategories() {
	var count int64
	DB.Model(&models.BlogCategory{}).Count(&count)
	if count > 0 {
		log.Println("  → Blog categories already exist, skipping")
		return
	}

	categories := []models.BlogCategory{
		{Name: "Engineering", Slug: "engineering"},
		{Name: "Notes", Slug: "notes"},
	}

	for _, c := range categories {
		DB.Create(&c)
	}
	log.Println("  → Blog categories seeded")
}

func seedBlogPosts() {
	var count int64
	DB.Model(&models.BlogPost{}).Count(&count)
	if count > 0 {
		log.Println("  → Blog posts already exist, skipping")
		return
	}

	// Find the engineering category to link the post
	var category models.BlogCategory
	if err := DB.Where("slug = ?", "engineering").First(&category).Error; err != nil {
		log.Printf("  ✗ Engineering category not found: %v", err)
		return
	}

	now := time.Now()
	post := models.BlogPost{
		CategoryID:  category.ID,
		Title:       "Building Liquid Glass UIs",
		Slug:        "building-liquid-glass-uis",
		ContentMD:   "# Building Liquid Glass UIs\n\nYour blog post content goes here...\n\n## Section 1\n\nWrite your content in markdown.",
		PublishedAt: &now,
	}
	DB.Create(&post)
	log.Println("  → Sample blog post seeded")
}

// mustMarshal is a helper that marshals a value to JSON.
// It panics on error — which is fine for seed data that we control.
// In production code, you'd handle the error instead.
func mustMarshal(v interface{}) datatypes.JSON {
	b, err := json.Marshal(v)
	if err != nil {
		panic("failed to marshal seed data: " + err.Error())
	}
	return datatypes.JSON(b)
}
