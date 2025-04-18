package db

import (
	"database/sql"
	"log"
)

// InitializeSchema runs the SQL to set up the users and sessions tables
func InitializeSchema(db *sql.DB) {
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		first_name TEXT NOT NULL,
		last_name TEXT NOT NULL,
		nickname TEXT NOT NULL UNIQUE,
		age INTEGER NOT NULL,
		gender TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL
	);`

	createSessionsTable := `
	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		nickname TEXT NOT NULL,
		expires_at DATETIME NOT NULL,
		FOREIGN KEY(user_id) REFERENCES users(id)
	);`

	_, err := db.Exec(createUsersTable)
	if err != nil {
		log.Fatalf("error creating users table: %v", err)
	}

	_, err = db.Exec(createSessionsTable)
	if err != nil {
		log.Fatalf("error creating sessions table: %v", err)
	}

	log.Println("✅ Database schema initialized successfully.")
}
