package main

import (
	"database/sql"
	"fmt"
	"net/http"

	"real-time-forum/handlers"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	db, err := sql.Open("sqlite3", "./users.db")
	if err != nil {
		panic("Failed to open database: " + err.Error())
	}
	defer db.Close()

	if err := handlers.CreateUsersTable(db); err != nil {
		panic("Failed to create table: " + err.Error())
	}

	fs := http.FileServer(http.Dir("./"))
	http.Handle("/", fs)

	http.HandleFunc("/signup", handlers.SignupHandler(db))

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
