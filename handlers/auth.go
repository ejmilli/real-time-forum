package handlers

import (
	"database/sql"
	"net/http"
	"time"
)

// CheckAuthHandler verifies if the user's session is valid
func CheckAuthHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get session cookie
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
	}
}
