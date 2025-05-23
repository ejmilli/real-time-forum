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
				SELECT p.id, p.user_id, p.category_id, p.title, p.content, p.likes, p.dislikes, p.created_at, u.nickname
				FROM posts p
				LEFT JOIN users u ON p.user_id = u.id
				WHERE p.category_id = ? 
				ORDER BY p.created_at DESC
			`, category)
		} else {
			// Get all posts
			rows, err = db.Query(`
				SELECT p.id, p.user_id, p.category_id, p.title, p.content, p.likes, p.dislikes, p.created_at, u.nickname
				FROM posts p
				LEFT JOIN users u ON p.user_id = u.id
				ORDER BY p.created_at DESC
			`)
		}
		
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []map[string]interface{}
		for rows.Next() {
			var p models.Post
			var userNickname sql.NullString
			
			err := rows.Scan(&p.ID, &p.UserID, &p.CategoryID, &p.Title, &p.Content, 
				&p.LikeCount, &p.DislikeCount, &p.CreatedAt, &userNickname)
			if err != nil {
				http.Error(w, "Error scanning post", http.StatusInternalServerError)
				return
			}
			
			// Create response with user nickname
			postData := map[string]interface{}{
				"id":            p.ID,
				"user_id":       p.UserID,
				"category_id":   p.CategoryID,
				"title":         p.Title,
				"content":       p.Content,
				"like_count":    p.LikeCount,
				"dislike_count": p.DislikeCount,
				"created_at":    p.CreatedAt,
				"user_nickname": userNickname.String,
			}
			posts = append(posts, postData)
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

		// Check authentication
		session := GetSession(db, r)
		if session == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var post models.Post
		err := json.NewDecoder(r.Body).Decode(&post)
		if err != nil {
			http.Error(w, "Invalid post data", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if post.Title == "" || post.Content == "" {
			http.Error(w, "Title and content are required", http.StatusBadRequest)
			return
		}

		// Generate ID and timestamp
		postID, err := uuid.NewV4()
		if err != nil {
			http.Error(w, "Failed to generate post ID", http.StatusInternalServerError)
			return
		}
		post.ID = postID.String() 
		post.UserID = session.UserID // Use session user ID
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

		// Return created post with user info
		response := map[string]interface{}{
			"id":            post.ID,
			"user_id":       post.UserID,
			"category_id":   post.CategoryID,
			"title":         post.Title,
			"content":       post.Content,
			"like_count":    0,
			"dislike_count": 0,
			"created_at":    post.CreatedAt,
			"user_nickname": session.Nickname,
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)
	}
}