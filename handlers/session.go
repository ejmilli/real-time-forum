package handlers

import (
	"net/http"
	"time"

	"github.com/gofrs/uuid"
)

type Session struct {
	UserID    string
	Nickname  string
	ExpiresAt time.Time
}

var sessions = map[string]*Session{}

func CreateSession(w http.ResponseWriter, userID, nickname string) string {
	sessionID, _ := uuid.NewV4()
	sid := sessionID.String()

	sessions[sid] = &Session{
		UserID:    userID,
		Nickname:  nickname,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sid,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   86400,
	})
	return sid
}

func GetSession(r *http.Request) *Session {
	cookie, err := r.Cookie("session")
	if err != nil {
		return nil
	}
	session, exists := sessions[cookie.Value]
	if !exists || session.ExpiresAt.Before(time.Now()) {
		return nil
	}
	return session
}

func ClearSession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err == nil {
		delete(sessions, cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}
