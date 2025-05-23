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

		// First, get the post with user nickname
		var post models.Post
		var userNickname string
		err := db.QueryRow(`
			SELECT p.id, p.user_id, p.category_id, p.title, p.content, p.likes, p.dislikes, p.created_at, u.nickname
			FROM posts p
			LEFT JOIN users u ON p.user_id = u.id
			WHERE p.id = ?
		`, postID).Scan(
			&post.ID, &post.UserID, &post.CategoryID, &post.Title, &post.Content, 
			&post.LikeCount, &post.DislikeCount, &post.CreatedAt, &userNickname,
		)
		
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Post not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Failed to fetch post", http.StatusInternalServerError)
			return
		}

		// Then, get all comments for this post with user nicknames
		rows, err := db.Query(`
			SELECT c.id, c.post_id, c.user_id, c.body, c.created_at, u.nickname
			FROM comments c
			LEFT JOIN users u ON c.user_id = u.id
			WHERE c.post_id = ? 
			ORDER BY c.created_at ASC
		`, postID)
		
		if err != nil {
			http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Prepare response structure
		var comments []map[string]interface{}
		for rows.Next() {
			var c models.Comment
			var commentUserNickname sql.NullString
			err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Body, &c.CreatedAt, &commentUserNickname)
			if err != nil {
				http.Error(w, "Error scanning comment", http.StatusInternalServerError)
				return
			}
			
			commentData := map[string]interface{}{
				"id":            c.ID,
				"post_id":       c.PostID,
				"user_id":       c.UserID,
				"body":          c.Body,
				"created_at":    c.CreatedAt,
				"user_nickname": commentUserNickname.String,
			}
			comments = append(comments, commentData)
		}

		// Combine post and comments in one response
		response := map[string]interface{}{
			"post": map[string]interface{}{
				"id":            post.ID,
				"user_id":       post.UserID,
				"category_id":   post.CategoryID,
				"title":         post.Title,
				"content":       post.Content,
				"like_count":    post.LikeCount,
				"dislike_count": post.DislikeCount,
				"created_at":    post.CreatedAt,
				"user_nickname": userNickname,
			},
			"comments": comments,
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

		// Check authentication
		session := GetSession(db, r)
		if session == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var comment models.Comment
		err := json.NewDecoder(r.Body).Decode(&comment)
		if err != nil {
			http.Error(w, "Invalid comment data", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if comment.PostID == "" || comment.Body == "" {
			http.Error(w, "Post ID and comment body are required", http.StatusBadRequest)
			return
		}

		// Generate UUID and timestamp
		commentID, err := uuid.NewV4()
		if err != nil {
			http.Error(w, "Failed to generate comment ID", http.StatusInternalServerError)
			return
		}
		comment.ID = commentID.String()
		comment.UserID = session.UserID // Use session user ID
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

		// Return created comment with user info
		response := map[string]interface{}{
			"id":            comment.ID,
			"post_id":       comment.PostID,
			"user_id":       comment.UserID,
			"body":          comment.Body,
			"created_at":    comment.CreatedAt,
			"user_nickname": session.Nickname,
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)
	}
}