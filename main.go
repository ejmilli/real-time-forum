package main

import (
	"database/sql"
	"fmt"
	"net/http"

	"log"
	"real-time-forum/db"
	"real-time-forum/handlers"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbConn, err := sql.Open("sqlite3", "./yourdb.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	defer dbConn.Close()

	db.InitializeSchema(dbConn)

	fs := http.FileServer(http.Dir("./"))
	http.Handle("/", fs)

	http.HandleFunc("/signup", handlers.SignupHandler(dbConn))

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
