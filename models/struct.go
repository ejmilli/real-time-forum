package models

import "time"


type Post struct {
    ID           string    `json:"id"`
    UserID       string    `json:"user_id"`
    CategoryID   string    `json:"category_id"`
    Title        string    `json:"title"`
    Content      string    `json:"content"`
    LikeCount    int       `json:"like_count"`
    DislikeCount int       `json:"dislike_count"`
    CreatedAt    time.Time `json:"created_at"`
}


type Comment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

type Session struct {
	UserID    string
	Nickname  string
	ExpiresAt time.Time
}
