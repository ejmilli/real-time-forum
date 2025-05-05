package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if err := r.ParseForm(); err != nil {
			http.Error(w, "Invalid form data", http.StatusBadRequest)
			return
		}

		loginType := r.FormValue("loginType")
		email := strings.TrimSpace(r.FormValue("email"))
		nickname := strings.TrimSpace(r.FormValue("nickname"))
		password := r.FormValue("password")

		if loginType != "email" && loginType != "nickname" {
			http.Error(w, "Invalid login type", http.StatusBadRequest)
			return
		}

		var userID, storedNickname, passwordHash string
		var err error

		if loginType == "email" {
			if email == "" {
				http.Error(w, "Email required", http.StatusBadRequest)
				return
			}
			err = db.QueryRow(`SELECT id, nickname, password_hash FROM users WHERE email = ?`, email).
				Scan(&userID, &storedNickname, &passwordHash)
		} else {
			if nickname == "" {
				http.Error(w, "Nickname required", http.StatusBadRequest)
				return
			}
			err = db.QueryRow(`SELECT id, nickname, password_hash FROM users WHERE nickname = ?`, nickname).
				Scan(&userID, &storedNickname, &passwordHash)
		}

		if err == sql.ErrNoRows {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		_, err = CreateSession(db, w, userID, storedNickname)
		if err != nil {
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		fmt.Fprintln(w, "Login successful")
	}
}
