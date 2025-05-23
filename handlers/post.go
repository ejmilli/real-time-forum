package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"real-time-forum/models"
	"time"

	"github.com/gofrs/uuid"
)

func GetAllPosts(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		category := r.URL.Query().Get("category")
		
		var rows *sql.Rows
		var err error
		
		if category != "" {
			// Filter posts by category
			rows, err = db.Query(`
				SELECT id, user_id, category_id, title, content, likes, dislikes, created_at 
				FROM posts 
				WHERE category_id = ? 
				ORDER BY created_at DESC
			`, category)
		} else {
			// Get all posts
			rows, err = db.Query(`
				SELECT id, user_id, category_id, title, content, likes, dislikes, created_at 
				FROM posts 
				ORDER BY created_at DESC
			`)
		}
		
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []models.Post
		for rows.Next() {
			var p models.Post
			err := rows.Scan(&p.ID, &p.UserID, &p.CategoryID, &p.Title, &p.Content, &p.LikeCount, &p.DislikeCount, &p.CreatedAt)
			if err != nil {
				http.Error(w, "Error scanning post", http.StatusInternalServerError)
				return
			}
			posts = append(posts, p)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}


func CreatePost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var post models.Post
		err := json.NewDecoder(r.Body).Decode(&post)
		if err != nil {
			http.Error(w, "Invalid post data", http.StatusBadRequest)
			return
		}

		// Generate ID and timestamp
		postID, err := uuid.NewV4()
		if err != nil {
			http.Error(w, "Failed to generate post ID", http.StatusInternalServerError)
			return
		}
		post.ID = postID.String() 
		post.CreatedAt = time.Now()
		
		// Set default category if not provided
		if post.CategoryID == "" {
			post.CategoryID = "general"
		}

		// Insert into database
		_, err = db.Exec(`
			INSERT INTO posts (id, user_id, category_id, title, content, likes, dislikes, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, post.ID, post.UserID, post.CategoryID, post.Title, post.Content, 0, 0, post.CreatedAt)
		if err != nil {
			http.Error(w, "Failed to save post", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(post)
	}
}