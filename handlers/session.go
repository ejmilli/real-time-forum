package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
)

type Session struct {
	UserID    string
	Nickname  string
	ExpiresAt time.Time
}

// CreateSession creates a new session and sets consistent cookie
func CreateSession(db *sql.DB, w http.ResponseWriter, userID, nickname string) (string, error) {
	sessionID, _ := uuid.NewV4()
	sid := sessionID.String()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err := db.Exec(`
		INSERT INTO sessions (id, user_id, nickname, expires_at)
		VALUES (?, ?, ?, ?)`,
		sid, userID, nickname, expiresAt,
	)
	if err != nil {
		return "", err
	}

	// Use consistent cookie name "session_id"
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sid,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   86400,
	})

	return sid, nil
}

// GetSession retrieves session with consistent cookie name
func GetSession(db *sql.DB, r *http.Request) *Session {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return nil
	}

	var sess Session
	err = db.QueryRow(`
		SELECT user_id, nickname, expires_at FROM sessions WHERE id = ?`,
		cookie.Value,
	).Scan(&sess.UserID, &sess.Nickname, &sess.ExpiresAt)

	if err != nil || sess.ExpiresAt.Before(time.Now()) {
		return nil
	}

	return &sess
}

// ClearSession removes session with consistent cookie name
func ClearSession(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err == nil {
		db.Exec(`DELETE FROM sessions WHERE id = ?`, cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}