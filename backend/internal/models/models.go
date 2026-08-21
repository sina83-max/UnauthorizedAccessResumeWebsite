package models

import (
	"time"

	"gorm.io/datatypes"

	"gorm.io/gorm"
)

// ResumeSection stores text content for the Personal/ folder.
// Most sections use ContentMD (markdown text).
// The "skills" section uses ContentJSON (JSONB) for nested data.
// The "resume" section uses ContentJSON to store { "pdf_url": "..." }.
type ResumeSection struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	Key         string         `gorm:"uniqueIndex:not null" json:"key"`
	Title       string         `json:"title"`
	ContentMD   string         `gorm:"type:text" json:"content_md,omitempty"`
	ContentJSON datatypes.JSON `gorm:"type:jsonb" json:"content_json,omitempty"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// Project represents a featured project shown in Personal/ folder.
// Each project becomes its own file node in the Finder.
type Project struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Title         string    `json:"title"`
	DescriptionMD string    `gorm:"type:text" json:"description_md"`
	RepoURL       string    `json:"repo_url"`
	LiveURL       string    `json:"live_url"`
	ImageURL      string    `json:"image_url"`
	SortOrder     int       `json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// BlogCategory groups blog posts (e.g., "Engineering", "Notes").
type BlogCategory struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
	Slug string `gorm:"uniqueIndex;not null" json:"slug"`
}

// BlogPost is a single blog article. Uses GORM soft delete —
// when you call DB.Delete(), it sets deleted_at instead of removing the row.
// GORM automatically filters out soft-deleted rows in queries.
type BlogPost struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CategoryID  uint           `json:"category_id"`
	Category    *BlogCategory  `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Title       string         `json:"title"`
	Slug        string         `gorm:"uniqueIndex;not null" json:"slug"`
	ContentMD   string         `gorm:"type:text" json:"content_md"`
	ContentHTML string         `gorm:"type:text" json:"content_html"`
	CoverImage  string         `gorm:"type:text" json:"cover_image"`
	Status      string         `gorm:"type:varchar(20);default:'draft'" json:"status"`
	PublishedAt *time.Time     `json:"published_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// SiteSetting is a key-value store for single-row config.
// Examples: "contact.name", "contact.email", "resume.pdf_url"
type SiteSetting struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Key   string `gorm:"uniqueIndex;not null" json:"key"`
	Value string `gorm:"type:text" json:"value"`
}

// AdminUser is a single seeded admin account. No signup flow.
// PasswordHash stores the bcrypt hash — json:"-" means it's never
// sent in API responses.
type AdminUser struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Username     string `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string `gorm:"not null" json:"-"`
}

// ContactMessage stores messages from the contact form (future feature).
type ContactMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Message   string    `gorm:"type:text" json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
