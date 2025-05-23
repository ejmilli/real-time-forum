package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"real-time-forum/models"
	"time"

	"github.com/gofrs/uuid"
)

// GetPostWithComments retrieves a single post with all its comments
func GetPostWithComments(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		postID := r.URL.Query().Get("id")
		if postID == "" {
			http.Error(w, "Post ID is required", http.StatusBadRequest)
			return
		}

		// First, get the post
		var post models.Post
		err := db.QueryRow(`
			SELECT id, user_id, category_id, title, content, likes, dislikes, created_at 
			FROM posts 
			WHERE id = ?
		`, postID).Scan(
			&post.ID, &post.UserID, &post.CategoryID, &post.Title, &post.Content, 
			&post.LikeCount, &post.DislikeCount, &post.CreatedAt,
		)
		
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Post not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Failed to fetch post", http.StatusInternalServerError)
			return
		}

		// Then, get all comments for this post
		rows, err := db.Query(`
			SELECT id, post_id, user_id, body, created_at 
			FROM comments 
			WHERE post_id = ? 
			ORDER BY created_at ASC
		`, postID)
		
		if err != nil {
			http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Prepare response structure
		var comments []models.Comment
		for rows.Next() {
			var c models.Comment
			err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Body, &c.CreatedAt)
			if err != nil {
				http.Error(w, "Error scanning comment", http.StatusInternalServerError)
				return
			}
			comments = append(comments, c)
		}

		// Combine post and comments in one response
		response := struct {
			Post     models.Post      `json:"post"`
			Comments []models.Comment `json:"comments"`
		}{
			Post:     post,
			Comments: comments,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// CreateComment handles adding a new comment to a post
func CreateComment(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var comment models.Comment
		err := json.NewDecoder(r.Body).Decode(&comment)
		if err != nil {
			http.Error(w, "Invalid comment data", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if comment.PostID == "" || comment.UserID == "" || comment.Body == "" {
			http.Error(w, "Post ID, User ID, and comment body are required", http.StatusBadRequest)
			return
		}

		// Generate UUID and timestamp
		commentID, err := uuid.NewV4()
		if err != nil {
			http.Error(w, "Failed to generate comment ID", http.StatusInternalServerError)
			return
		}
		comment.ID = commentID.String()
		comment.CreatedAt = time.Now()

		// Insert into database
		_, err = db.Exec(`
			INSERT INTO comments (id, post_id, user_id, body, created_at)
			VALUES (?, ?, ?, ?, ?)
		`, comment.ID, comment.PostID, comment.UserID, comment.Body, comment.CreatedAt)
		
		if err != nil {
			http.Error(w, "Failed to save comment", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(comment)
	}
}