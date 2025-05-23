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


// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next(w, r)
	}
}

func ActivityMiddleware(db *sql.DB, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handlers.UpdateLastActive(db, w, r)
		next(w, r)
	}
}



	// Connect to DB

func main() {

	dbConn, err := sql.Open("sqlite3", "./yourdb.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	defer dbConn.Close()

	db.InitializeSchema(dbConn)

	// Static assets (index.html, JS, CSS)
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// Auth routes
	http.HandleFunc("/signup", LoggingMiddleware(handlers.SignupHandler(dbConn)))
	http.HandleFunc("/login", LoggingMiddleware(handlers.LoginHandler(dbConn)))
	http.HandleFunc("/api/logout", LoggingMiddleware(handlers.LogoutHandler(dbConn)))
	http.HandleFunc("/api/check-auth", LoggingMiddleware(handlers.CheckAuthHandler(dbConn)))

	// Posts API
http.HandleFunc("/api/posts", LoggingMiddleware(ActivityMiddleware(dbConn, handlers.PostsHandler(dbConn))))

	// Online presence
	http.HandleFunc("/api/online-users", LoggingMiddleware(ActivityMiddleware(dbConn, handlers.OnlineUsersHandler(dbConn))))

	// Run the server
	fmt.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))


}
