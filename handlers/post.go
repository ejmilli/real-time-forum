package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"real-time-forum/models"
	"time"

	"github.com/gofrs/uuid"
)

// PostsHandler handles both GET and POST for posts
func PostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("PostsHandler called: %s %s", r.Method, r.URL.Path)
		
		// Check session first
		session := GetSession(db, r)
		if session == nil || session.ExpiresAt.Before(time.Now()) {
			log.Printf("Unauthorized access attempt")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		log.Printf("User authenticated: %s", session.UserID)

		switch r.Method {
		case "GET":
			handleGetPosts(db, w, r, session)
		case "POST":
			handleCreatePost(db, w, r, session)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}
}

// handleGetPosts gets posts with optional category filter
func handleGetPosts(db *sql.DB, w http.ResponseWriter, r *http.Request, session *models.Session) {
	log.Printf("Getting posts for user: %s", session.UserID)
	
	category := r.URL.Query().Get("category")
	log.Printf("Category filter: %s", category)

	var rows *sql.Rows
	var err error

	if category != "" && category != "all" {
		log.Printf("Fetching posts for category: %s", category)
		rows, err = db.Query(`
			SELECT id, user_id, category_id, title, content, likes, dislikes, created_at 
			FROM posts 
			WHERE category_id = ? 
			ORDER BY created_at DESC
		`, category)
	} else {
		log.Printf("Fetching all posts")
		rows, err = db.Query(`
			SELECT id, user_id, category_id, title, content, likes, dislikes, created_at 
			FROM posts 
			ORDER BY created_at DESC
		`)
	}

	if err != nil {
		log.Printf("Database query error: %v", err)
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		err := rows.Scan(&p.ID, &p.UserID, &p.CategoryID, &p.Title, &p.Content, &p.LikeCount, &p.DislikeCount, &p.CreatedAt)
		if err != nil {
			log.Printf("Error scanning post: %v", err)
			http.Error(w, "Error scanning post", http.StatusInternalServerError)
			return
		}
		posts = append(posts, p)
	}

	// Check for any row iteration errors
	if err = rows.Err(); err != nil {
		log.Printf("Row iteration error: %v", err)
		http.Error(w, "Error processing posts", http.StatusInternalServerError)
		return
	}

	log.Printf("Found %d posts", len(posts))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

// handleCreatePost creates a new post
func handleCreatePost(db *sql.DB, w http.ResponseWriter, r *http.Request, session *models.Session) {
	log.Printf("Creating post for user: %s", session.UserID)
	
	// Log request body for debugging
	log.Printf("Content-Type: %s", r.Header.Get("Content-Type"))
	
	var post models.Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid post data: "+err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Decoded post: Title=%s, Content=%s, CategoryID=%s", post.Title, post.Content, post.CategoryID)

	// Validation
	if post.Title == "" {
		log.Printf("Missing title")
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}
	
	if post.Content == "" {
		log.Printf("Missing content")
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	// Generate UUID
	postID, err := uuid.NewV4()
	if err != nil {
		log.Printf("UUID generation error: %v", err)
		http.Error(w, "Failed to generate post ID", http.StatusInternalServerError)
		return
	}
	
	post.ID = postID.String()
	post.CreatedAt = time.Now()
	post.UserID = session.UserID

	// Set default category if empty
	if post.CategoryID == "" {
		post.CategoryID = "general"
	}

	// Initialize likes/dislikes to 0
	post.LikeCount = 0
	post.DislikeCount = 0

	log.Printf("Inserting post: ID=%s, UserID=%s, CategoryID=%s", post.ID, post.UserID, post.CategoryID)

	// Insert into database
	_, err = db.Exec(`
		INSERT INTO posts (id, user_id, category_id, title, content, likes, dislikes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		post.ID, post.UserID, post.CategoryID, post.Title, post.Content, 
		post.LikeCount, post.DislikeCount, post.CreatedAt,
	)
	
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Failed to save post: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Post created successfully: %s", post.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	
	if err := json.NewEncoder(w).Encode(post); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}