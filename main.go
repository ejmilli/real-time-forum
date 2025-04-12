package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var tmpl *template.Template
func main() {
	// Initialize database
	db, err := sql.Open("sqlite3", "./users.db")
	if err != nil {
			panic("Failed to open database: " + err.Error())
	}
	defer db.Close()

	// Create users table if not exists
	if err := createUsersTable(db); err != nil {
			panic("Failed to create table: " + err.Error())
	}

	// Serve static files from the current directory (or specify your directory)
	fs := http.FileServer(http.Dir("./"))
	http.Handle("/", fs)
	
	// API routes - handle POST requests
	http.HandleFunc("/signup", signupHandler(db))

	// Start server
	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}


func createUsersTable(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		first_name TEXT NOT NULL,
		last_name TEXT NOT NULL,
		nickname TEXT NOT NULL UNIQUE,
		age INTEGER NOT NULL,
		gender TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL
	)`
	_, err := db.Exec(query)
	return err
}

func signupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse form data
		if err := r.ParseForm(); err != nil {
			http.Error(w, "Invalid form data", http.StatusBadRequest)
			return
		}

		// Validate and process form data
		user, err := validateAndProcessForm(r, db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Create user in database
		if err := createUser(db, user); err != nil {
			status := http.StatusInternalServerError
			if strings.Contains(err.Error(), "UNIQUE constraint failed") {
				status = http.StatusConflict
			}
			http.Error(w, err.Error(), status)
			return
		}

		w.WriteHeader(http.StatusCreated)
		fmt.Fprintf(w, "User created successfully")
	}
}

func validateAndProcessForm(r *http.Request, db *sql.DB) (*User, error) {
	// Extract and trim form values
	firstName := strings.TrimSpace(r.FormValue("firstname"))
	lastName := strings.TrimSpace(r.FormValue("lastname"))
	nickname := strings.TrimSpace(r.FormValue("nickname"))
	ageStr := strings.TrimSpace(r.FormValue("age"))
	gender := strings.TrimSpace(r.FormValue("gender"))
	email := strings.TrimSpace(r.FormValue("email"))
	password := r.FormValue("password")
	confirmPassword := r.FormValue("confirmPassword")

	// Validate required fields
	if firstName == "" || lastName == "" || nickname == "" || gender == "" || email == "" {
		return nil, fmt.Errorf("all fields are required")
	}

	// Validate nickname
	if len(nickname) < 3 || len(nickname) > 16 {
		return nil, fmt.Errorf("nickname must be between 3-16 characters")
	}
	if !regexp.MustCompile(`^[\w\-]+$`).MatchString(nickname) {
		return nil, fmt.Errorf("invalid nickname format")
	}

	// Validate age
	age, err := strconv.Atoi(ageStr)
	if err != nil || age < 13 || age > 100 {
		return nil, fmt.Errorf("age must be between 13-100")
	}

	// Validate email
	if !regexp.MustCompile(`^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`).MatchString(email) {
		return nil, fmt.Errorf("invalid email format")
	}

	// Validate password
	if len(password) < 8 {
		return nil, fmt.Errorf("password must be at least 8 characters")
	}
	if strings.ToLower(password) == "password" {
		return nil, fmt.Errorf("password cannot be 'password'")
	}
	if password != confirmPassword {
		return nil, fmt.Errorf("passwords do not match")
	}

	// Check unique constraints
	if exists, _ := checkExists(db, "email", email); exists {
		return nil, fmt.Errorf("email already registered")
	}
	if exists, _ := checkExists(db, "nickname", nickname); exists {
		return nil, fmt.Errorf("nickname already taken")
	}

	// Generate password hash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to create user")
	}

	// Generate UUID
	id, err := uuid.NewV4()
	if err != nil {
		return nil, fmt.Errorf("failed to create user")
	}

	return &User{
		ID:           id.String(),
		FirstName:    firstName,
		LastName:     lastName,
		Nickname:     nickname,
		Age:          age,
		Gender:       gender,
		Email:        email,
		PasswordHash: string(hashedPassword),
	}, nil
}

type User struct {
	ID           string
	FirstName    string
	LastName     string
	Nickname     string
	Age          int
	Gender       string
	Email        string
	PasswordHash string
}

func checkExists(db *sql.DB, field, value string) (bool, error) {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM users WHERE %s = ?", field)
	err := db.QueryRow(query, value).Scan(&count)
	return count > 0, err
}

func createUser(db *sql.DB, user *User) error {
	result, err := db.Exec(`
			INSERT INTO users 
			(id, first_name, last_name, nickname, age, gender, email, password_hash)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			user.ID,
			user.FirstName,
			user.LastName,
			user.Nickname,
			user.Age,
			user.Gender,
			user.Email,
			user.PasswordHash,
	)
	
	if err != nil {
			fmt.Println("Database error:", err)
			return err
	}
	
	rows, _ := result.RowsAffected()
	fmt.Println("Rows affected:", rows)
	return nil
}


func ExecuteTmpl(w http.ResponseWriter, name string, data interface{}) {
	err := tmpl.ExecuteTemplate(w, name, data)
	if err != nil {
		ExecuteError(w, "Tmpl", "Error executing page template", http.StatusInternalServerError)
	}
}

// Execute error page if possible, otherwise use inbuilt http error
func ExecuteError(w http.ResponseWriter, errtype, msg string, code int) {
	errorData := ErrorData{errtype, msg, code}
	w.WriteHeader(code)
	if errorData.Type == "Tmpl" {
		err := tmpl.ExecuteTemplate(w, "error.html", errorData)
		if err != nil {
			message := fmt.Sprintf("Error %d\n%s", errorData.Code, errorData.Message)
			http.Error(w, message, http.StatusNotFound)
		}
		return
	}
	type errorJson struct {
		Message string `json:"message"`
	}
	errJson := errorJson{errorData.Message}
	json.NewEncoder(w).Encode(errJson)
}


type ErrorData struct {
	Type    string
	Message string
	Code    int
}

// Session store
var sessions = map[string]*Session{}

type Session struct {
    UserID    string
    Nickname  string
    ExpiresAt time.Time
}

// Generate a session and set cookie
func createSession(w http.ResponseWriter, userID, nickname string) string {
    sessionID, _ := uuid.NewV4()
    sid := sessionID.String()
    
    // Create session with 24 hour expiration
    sessions[sid] = &Session{
        UserID:    userID,
        Nickname:  nickname,
        ExpiresAt: time.Now().Add(24 * time.Hour),
    }
    
    // Set cookie
    cookie := http.Cookie{
        Name:     "session",
        Value:    sid,
        Path:     "/",
        HttpOnly: true,
        MaxAge:   86400, // 24 hours
    }
    
    http.SetCookie(w, &cookie)
    return sid
}

// Get session from cookie
func getSession(r *http.Request) *Session {
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

// Clear session
func clearSession(w http.ResponseWriter, r *http.Request) {
    cookie, err := r.Cookie("session")
    if err == nil {
        delete(sessions, cookie.Value)
    }
    
    // Set expired cookie
    http.SetCookie(w, &http.Cookie{
        Name:     "session",
        Value:    "",
        Path:     "/",
        HttpOnly: true,
        MaxAge:   -1,
    })
}