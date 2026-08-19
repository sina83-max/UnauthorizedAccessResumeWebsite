package database

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"portfolio-api/internal/config"
	"portfolio-api/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
)

// Seed populate the db with initial data.
// Set SEED_FORCE=true to drop and re-seed all tables.
func Seed() {
	force := os.Getenv("SEED_FORCE") == "true"
	if force {
		log.Println("  → SEED_FORCE=true, dropping existing data…")
		DB.Exec("TRUNCATE TABLE blog_posts, blog_categories, projects, resume_sections, site_settings, admin_users, contact_messages RESTART IDENTITY CASCADE")
	}
	seedAdmin()
	seedResumeSections()
	seedSiteSettings()
	seedProjects()
	seedBlogCategories()
	seedBlogPosts()
	log.Println("✓ Seed completed")
}

func seedAdmin() {
	var count int64
	DB.Model(&models.AdminUser{}).Count(&count)
	if count > 0 {
		log.Println("  → Admin user already exists, skipping")
		return
	}

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
			Key:   "profile",
			Title: "Profile",
			ContentMD: `# Profile

Backend developer and software engineering enthusiast with hands-on experience in backend development and cloud support. Strong foundation in Python, DevOps practices, and cloud computing, with a growing focus on data-driven systems and data-related products and emerging technologies. Ranked 58th nationwide in the Konkur exam, I'm highly motivated to learn, collaborate, and contribute to scalable data and software engineering solutions.`,
		},
		{
			Key:   "experience",
			Title: "Experience",
			ContentMD: `# Work Experience

## Back-end Developer
**Kashef Banking Security Governance** — Tehran, Iran
*Aug 2025 – Present*

- Developing an offline Machine Learning BERT model for binary classification tasks
- Developing and maintaining backend services using FastAPI, PostgreSQL, MongoDB, and Redis for secure and scalable banking systems
- Managing CI/CD pipelines and containerized deployments with Docker, ensuring smooth and reliable software delivery
- Implementing monitoring and logging strategies to ensure high availability and performance across services

---

## Technical Cloud Support Specialist
**abrNOC & Cloudzy** — Tehran, Iran
*Jul 2023 – Sep 2024*

- Familiarity and working with monitoring tools like Grafana and Node Exporter
- Implementing Linux Skills to fulfill customers' managed requests
- Learning virtualization technologies like QEMU
- Implementing Bash and Python scripts to automate repetitive tasks to minimize the required amount of time
- Working with logging systems like Rsyslog and implementing it in test environments
- Working with web servers like Apache and Nginx
- Working with build tools like Maven and Node.JS`,
		},
		{
			Key:   "education",
			Title: "Education",
			ContentMD: `# Education

## Bachelor of Industrial Engineering
**Amir Kabir University of Technology (Tehran Polytechnic)** — Tehran, Iran
*2022 – Present*

Ranked 58th nationwide in the Konkur exam.`,
		},
		{
			Key:   "skills",
			Title: "Skills",
			ContentJSON: mustMarshal(map[string]interface{}{
				"categories": []map[string]interface{}{
					{
						"name": "Python for Data",
						"items": []string{"Pandas, NumPy", "Writing data pipelines & transformations", "Handling large datasets"},
					},
					{
						"name": "FastAPI",
						"items": []string{"Asynchronous programming, dependency injection, routing", "API Development with Pydantic, validation"},
					},
					{
						"name": "Docker & Containerization",
						"items": []string{"Container Lifecycle Management", "Docker Compose - Multi-container applications", "CI/CD with GitHub Actions"},
					},
					{
						"name": "Machine Learning",
						"items": []string{"Built and integrated ML models into backend services", "Data preprocessing, feature engineering, model training"},
					},
					{
						"name": "Golang",
						"items": []string{"Concurrent Systems & Goroutines", "Thread-Safe Data Structures", "REST APIs & Microservices"},
					},
					{
						"name": "PostgreSQL & SQL",
						"items": []string{"Advanced SQL: joins, CTEs, subqueries, window functions", "Integrated with SQLAlchemy"},
					},
					{
						"name": "Redis",
						"items": []string{"Key-value storage, data persistence, pub/sub", "Task Queues with Celery or RQ"},
					},
					{
						"name": "Apache Kafka",
						"items": []string{"Data ingestion pipelines for real-time streaming", "Event-driven architectures for analytics"},
					},
					{
						"name": "Monitoring",
						"items": []string{"Prometheus - metrics with client libraries", "Grafana - alerts, Prometheus integration"},
					},
					{
						"name": "Version Control & GitHub",
						"items": []string{"Branching, Merging, Commit management", "GitHub Actions CI/CD"},
					},
					{
						"name": "Linux & SysAdmin",
						"items": []string{"Shell Scripting & Automation", "System Monitoring & Logs"},
					},
					{
						"name": "Statistics & Analytics",
						"items": []string{"Descriptive statistics", "Probability", "Basic hypothesis testing"},
					},
				},
			}),
		},
		{
			Key: "resume",
			Title: "Resume",
			ContentJSON: mustMarshal(map[string]string{
				"pdf_url": "/uploads/resume.pdf",
			}),
		},
		{
			Key:   "languages",
			Title: "Languages",
			ContentJSON: mustMarshal(map[string]interface{}{
				"languages": []map[string]string{
					{"name": "English", "level": "Fluent"},
					{"name": "Persian", "level": "Native"},
				},
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
		{Key: "contact.location", Value: "Koohak Blvd, District 22, Tehran"},
		{Key: "contact.title", Value: "Backend Dev and Data Enthusiast"},
		{Key: "contact.github", Value: "https://github.com/sina83-max"},
		{Key: "contact.linkedin", Value: "https://linkedin.com/in/sina-beignazari"},
		{Key: "contact.dob", Value: "2005/2/1"},
	}

	for _, s := range settings {
		DB.Create(&s)
	}
	log.Println("  → Site settings seeded")
}

func seedProjects() {
	var count int64
	DB.Model(&models.Project{}).Count(&count)
	if count > 0 {
		log.Println("  → Projects already exist, skipping")
		return
	}

	projects := []models.Project{
		{
			Title:         "Recipe App API",
			DescriptionMD: "A backend API built with Django and Django REST Framework to manage recipes and ingredients. Implemented in TDD coding procedure.\n\n- **Django + DRF:** RESTful API development\n- **PostgreSQL:** Database management with Django ORM\n- **Docker:** Containerized deployment\n- **GitHub Actions:** Automated CI/CD pipeline for testing and linting\n- **Testing:** Comprehensive test coverage with pytest",
			RepoURL:       "https://github.com/sina83-max/recipe-app-api",
			SortOrder:     1,
		},
		{
			Title:         "Real Time Messaging App",
			DescriptionMD: "Built a production-ready messaging API with FastAPI and SQLAlchemy backed by PostgreSQL, implementing secure JWT authentication, message delivery/read receipts, searchable/filterable endpoints, and Dockerized deployments.\n\n- **FastAPI:** High-performance async API\n- **SQLAlchemy + PostgreSQL:** Data persistence\n- **JWT Auth:** Secure authentication\n- **Docker:** Containerized deployment",
			RepoURL:       "https://github.com/sina83-max/realtime-messaging",
			SortOrder:     2,
		},
		{
			Title:         "Analyzing a Carseats Dataset",
			DescriptionMD: "Built an end-to-end data pipeline in Python to ingest, clean and prepare Carseats CSV data for ML training, focusing on reproducibility and artifact management.\n\n- **Pandas:** ETL and preprocessing (categorical encoding)\n- **scikit-learn:** Train/test splits and feature preparation\n- **joblib:** Model serialization\n- **loguru:** Structured logging\n- **matplotlib/Jupyter:** Reporting\n- **Docker:** Containerized reproducibility",
			RepoURL:       "https://github.com/sina83-max/carseats-analysis",
			SortOrder:     3,
		},
		{
			Title:         "Go-Redis Database Project",
			DescriptionMD: "Built a Redis-compatible in-memory database using Go, implementing the RESP protocol and AOF persistence.\n\n- **Go:** Core language\n- **RESP Protocol:** Redis wire protocol implementation\n- **Concurrent Data Structures:** Goroutines, mutexes\n- **File I/O:** AOF persistence\n- **Docker:** Containerized deployment",
			RepoURL:       "https://github.com/sina83-max/go-redis",
			SortOrder:     4,
		},
		{
			Title:         "Python-Kafka Project",
			DescriptionMD: "Built and maintained Python-based streaming pipelines using Apache Kafka, implementing producers/consumers.\n\n- **Python:** Core language\n- **Apache Kafka:** Event streaming\n- **Kafka Client Libraries:** Producer/Consumer APIs\n- **Docker:** Containerized deployment\n- **Git:** Version control",
			RepoURL:       "https://github.com/sina83-max/python-kafka",
			SortOrder:     5,
		},
	}

	for _, p := range projects {
		DB.Create(&p)
	}
	log.Println("  → Projects seeded")
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

	var category models.BlogCategory
	if err := DB.Where("slug = ?", "engineering").First(&category).Error; err != nil {
		log.Printf("  ✗ Engineering category not found: %v", err)
		return
	}

	now := time.Now()
	post := models.BlogPost{
		CategoryID:  category.ID,
		Title:       "Building Banking Backend Systems with FastAPI",
		Slug:        "building-banking-backend-systems",
		ContentMD:   "# Building Banking Backend Systems with FastAPI\n\nIn this post, I share my experience building secure and scalable backend services for banking systems using FastAPI, PostgreSQL, MongoDB, and Redis.\n\n## Architecture Overview\n\nThe system was designed with security as the top priority — offline ML models for fraud detection, containerized microservices, and comprehensive monitoring.\n\n## Key Technologies\n\n- **FastAPI** for high-performance async APIs\n- **PostgreSQL** for transactional data\n- **MongoDB** for document storage\n- **Redis** for caching and pub/sub\n- **Docker** for containerization\n- **Prometheus + Grafana** for monitoring\n\n## Lessons Learned\n\nBuilding systems in the banking domain teaches you the importance of reliability, audit trails, and defensive programming. Every edge case matters when money is involved.",
		PublishedAt: &now,
	}
	DB.Create(&post)
	log.Println("  → Sample blog post seeded")
}

func mustMarshal(v interface{}) datatypes.JSON {
	b, err := json.Marshal(v)
	if err != nil {
		panic("failed to marshal seed data: " + err.Error())
	}
	return datatypes.JSON(b)
}
