package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

// CheckAuthHandler verifies if the user's session is valid
func CheckAuthHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get session cookie - using consistent name "session_id"
		cookie, err := r.Cookie("session_id")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		sessionID := cookie.Value
		var expiresAt time.Time

		// Check if session exists and is valid
		err = db.QueryRow("SELECT expires_at FROM sessions WHERE id = ?", sessionID).Scan(&expiresAt)
		if err != nil || expiresAt.Before(time.Now()) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Session is valid
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}

// GetCurrentUserHandler returns current user info from session
func GetCurrentUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get session cookie
		cookie, err := r.Cookie("session_id")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		sessionID := cookie.Value
		var userID, nickname string
		var expiresAt time.Time

		// Get user info from session
		err = db.QueryRow(`
			SELECT user_id, nickname, expires_at 
			FROM sessions 
			WHERE id = ?
		`, sessionID).Scan(&userID, &nickname, &expiresAt)

		if err != nil || expiresAt.Before(time.Now()) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Get additional user details
		var email, createdAt string
		err = db.QueryRow(`
			SELECT email, created_at 
			FROM users 
			WHERE id = ?
		`, userID).Scan(&email, &createdAt)

		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		// Return user info
		userInfo := map[string]interface{}{
			"id":         userID,
			"nickname":   nickname,
			"email":      email,
			"created_at": createdAt,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(userInfo)
	}
}

// LogoutHandler ends the user session
func LogoutHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get session cookie
		cookie, err := r.Cookie("session_id")
		if err == nil {
			sessionID := cookie.Value

			// Delete session from database
			_, err = db.Exec("DELETE FROM sessions WHERE id = ?", sessionID)
			if err != nil {
				http.Error(w, "Server error", http.StatusInternalServerError)
				return
			}
		}

		// Clear cookie regardless of whether we found one
		expiredCookie := http.Cookie{
			Name:     "session_id",
			Value:    "",
			Path:     "/",
			Expires:  time.Unix(0, 0),
			HttpOnly: true,
		}
		http.SetCookie(w, &expiredCookie)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Logged out successfully"))
	}
}