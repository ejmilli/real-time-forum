// posts.js - CREATE THIS NEW FILE
// This contains the complete PostsManager class

class PostsManager {
  constructor(router, apiBase = "") {
    this.router = router;
    this.apiBase = apiBase;
    this.currentCategory = "";
    this.posts = [];
    this.currentPost = null;
    this.comments = [];

    // Add routes to router
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.addRoute("/posts", () => this.renderPostsList());
    this.router.addRoute("/posts/category/:category", (params) =>
      this.renderPostsList(params.category)
    );
    this.router.addRoute("/posts/create", () => this.renderCreatePost());
    this.router.addRoute("/posts/view/:id", (params) =>
      this.renderPostView(params.id)
    );
  }

  // Main Posts List View
  async renderPostsList(category = "") {
    this.currentCategory = category;

    const container = document.getElementById("main-content");
    container.innerHTML = this.getPostsListTemplate();

    await this.loadPosts(category);
    this.setupPostsListeners();
  }

  getPostsListTemplate() {
    return `
            <div class="posts-container">
                <div class="posts-header">
                    <h2>Posts ${
                      this.currentCategory ? `- ${this.currentCategory}` : ""
                    }</h2>
                    <button class="btn btn-primary" onclick="postsManager.navigateToCreatePost()">
                        Create New Post
                    </button>
                </div>
                
                <div class="category-filters">
                    <button class="category-btn ${
                      !this.currentCategory ? "active" : ""
                    }" 
                            onclick="postsManager.filterByCategory('')">All</button>
                    <button class="category-btn ${
                      this.currentCategory === "general" ? "active" : ""
                    }" 
                            onclick="postsManager.filterByCategory('general')">General</button>
                    <button class="category-btn ${
                      this.currentCategory === "tech" ? "active" : ""
                    }" 
                            onclick="postsManager.filterByCategory('tech')">Tech</button>
                    <button class="category-btn ${
                      this.currentCategory === "gaming" ? "active" : ""
                    }" 
                            onclick="postsManager.filterByCategory('gaming')">Gaming</button>
                    <button class="category-btn ${
                      this.currentCategory === "sports" ? "active" : ""
                    }" 
                            onclick="postsManager.filterByCategory('sports')">Sports</button>
                </div>
                
                <div id="posts-list" class="posts-list">
                    <div class="loading">Loading posts...</div>
                </div>
            </div>
        `;
  }

  // Create Post View
  renderCreatePost() {
    const container = document.getElementById("main-content");
    container.innerHTML = this.getCreatePostTemplate();
    this.setupCreatePostListeners();
  }

  getCreatePostTemplate() {
    return `
            <div class="create-post-container">
                <div class="create-post-header">
                    <h2>Create New Post</h2>
                    <button class="btn btn-secondary" onclick="postsManager.router.navigate('/posts')">
                        Back to Posts
                    </button>
                </div>
                
                <form id="create-post-form" class="post-form">
                    <div class="form-group">
                        <label for="post-title">Title *</label>
                        <input type="text" id="post-title" name="title" required 
                               placeholder="Enter post title...">
                    </div>
                    
                    <div class="form-group">
                        <label for="post-category">Category</label>
                        <select id="post-category" name="category_id">
                            <option value="general">General</option>
                            <option value="tech">Technology</option>
                            <option value="gaming">Gaming</option>
                            <option value="sports">Sports</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="post-content">Content *</label>
                        <textarea id="post-content" name="content" required 
                                  placeholder="Write your post content..." rows="8"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Create Post</button>
                        <button type="button" class="btn btn-secondary" 
                                onclick="postsManager.router.navigate('/posts')">Cancel</button>
                    </div>
                </form>
            </div>
        `;
  }

  // Single Post View with Comments
  async renderPostView(postId) {
    const container = document.getElementById("main-content");
    container.innerHTML = '<div class="loading">Loading post...</div>';

    try {
      const response = await fetch(
        `${this.apiBase}/api/posts/comments?id=${postId}`
      );
      if (!response.ok) throw new Error("Failed to fetch post");

      const data = await response.json();
      this.currentPost = data.post;
      this.comments = data.comments || [];

      container.innerHTML = this.getPostViewTemplate();
      this.setupPostViewListeners();
    } catch (error) {
      container.innerHTML = `<div class="error">Error loading post: ${error.message}</div>`;
    }
  }

  getPostViewTemplate() {
    if (!this.currentPost) return '<div class="error">Post not found</div>';

    return `
            <div class="post-view-container">
                <div class="post-view-header">
                    <button class="btn btn-secondary" onclick="postsManager.router.navigate('/posts')">
                        ← Back to Posts
                    </button>
                </div>
                
                <article class="post-detail">
                    <header class="post-header">
                        <h1>${this.escapeHtml(this.currentPost.title)}</h1>
                        <div class="post-meta">
                            <span class="category">${
                              this.currentPost.category_id
                            }</span>
                            <span class="date">${this.formatDate(
                              this.currentPost.created_at
                            )}</span>
                            <div class="post-reactions">
                                <button class="reaction-btn like-btn">
                                    👍 ${this.currentPost.like_count || 0}
                                </button>
                                <button class="reaction-btn dislike-btn">
                                    👎 ${this.currentPost.dislike_count || 0}
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div class="post-content">
                        ${this.escapeHtml(this.currentPost.content).replace(
                          /\n/g,
                          "<br>"
                        )}
                    </div>
                </article>
                
                <section class="comments-section">
                    <h3>Comments (${this.comments.length})</h3>
                    
                    <form id="comment-form" class="comment-form">
                        <textarea id="comment-body" name="body" required 
                                  placeholder="Write a comment..." rows="3"></textarea>
                        <button type="submit" class="btn btn-primary">Add Comment</button>
                    </form>
                    
                    <div id="comments-list" class="comments-list">
                        ${this.renderComments()}
                    </div>
                </section>
            </div>
        `;
  }

  renderComments() {
    if (this.comments.length === 0) {
      return '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    }

    return this.comments
      .map(
        (comment) => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">User ${comment.user_id}</span>
                    <span class="comment-date">${this.formatDate(
                      comment.created_at
                    )}</span>
                </div>
                <div class="comment-body">
                    ${this.escapeHtml(comment.body).replace(/\n/g, "<br>")}
                </div>
            </div>
        `
      )
      .join("");
  }

  // API Methods
  async loadPosts(category = "") {
    try {
      const url = category
        ? `${this.apiBase}/api/posts?category=${category}`
        : `${this.apiBase}/api/posts`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch posts");

      this.posts = await response.json();
      this.renderPostsList_Update();
    } catch (error) {
      document.getElementById(
        "posts-list"
      ).innerHTML = `<div class="error">Error loading posts: ${error.message}</div>`;
    }
  }

  renderPostsList_Update() {
    const postsContainer = document.getElementById("posts-list");

    if (this.posts.length === 0) {
      postsContainer.innerHTML = '<div class="no-posts">No posts found.</div>';
      return;
    }

    postsContainer.innerHTML = this.posts
      .map(
        (post) => `
            <article class="post-card" onclick="postsManager.navigateToPost('${
              post.id
            }')">
                <header class="post-card-header">
                    <h3>${this.escapeHtml(post.title)}</h3>
                    <span class="post-category">${post.category_id}</span>
                </header>
                <div class="post-preview">
                    ${this.escapeHtml(post.content.substring(0, 150))}${
          post.content.length > 150 ? "..." : ""
        }
                </div>
                <footer class="post-card-footer">
                    <span class="post-date">${this.formatDate(
                      post.created_at
                    )}</span>
                    <div class="post-stats">
                        <span>👍 ${post.like_count || 0}</span>
                        <span>👎 ${post.dislike_count || 0}</span>
                    </div>
                </footer>
            </article>
        `
      )
      .join("");
  }

  async createPost(formData) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showMessage("Please log in to create a post", "error");
        return;
      }

      const postData = {
        title: formData.get("title"),
        content: formData.get("content"),
        category_id: formData.get("category_id"),
        user_id: currentUser.id,
      };

      const response = await fetch(`${this.apiBase}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        this.router.navigate("/posts");
        this.showMessage("Post created successfully!", "success");
      } else {
        throw new Error("Failed to create post");
      }
    } catch (error) {
      this.showMessage(`Error creating post: ${error.message}`, "error");
    }
  }

  async addComment(postId, commentBody) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showMessage("Please log in to comment", "error");
        return;
      }

      const commentData = {
        post_id: postId,
        user_id: currentUser.id,
        body: commentBody,
      };

      const response = await fetch(`${this.apiBase}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      });

      if (response.ok) {
        const newComment = await response.json();
        this.comments.push(newComment);

        document.getElementById("comments-list").innerHTML =
          this.renderComments();
        document.getElementById("comment-form").reset();

        this.showMessage("Comment added successfully!", "success");
      } else {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      this.showMessage(`Error adding comment: ${error.message}`, "error");
    }
  }

  // Event Listeners
  setupPostsListeners() {
    // Category buttons handled by onclick attributes
  }

  setupCreatePostListeners() {
    const form = document.getElementById("create-post-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      await this.createPost(formData);
    });
  }

  setupPostViewListeners() {
    const commentForm = document.getElementById("comment-form");
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const commentBody = document.getElementById("comment-body").value.trim();
      if (commentBody) {
        await this.addComment(this.currentPost.id, commentBody);
      }
    });
  }

  // Navigation
  navigateToCreatePost() {
    this.router.navigate("/posts/create");
  }

  navigateToPost(postId) {
    this.router.navigate(`/posts/view/${postId}`);
  }

  filterByCategory(category) {
    if (category) {
      this.router.navigate(`/posts/category/${category}`);
    } else {
      this.router.navigate("/posts");
    }
  }

  // Utility Methods
  getCurrentUser() {
    // UPDATE THIS to match your auth system
    // Example: get from session storage, local storage, or global variable
    const sessionData =
      sessionStorage.getItem("userSession") ||
      localStorage.getItem("userSession");
    if (sessionData) {
      return JSON.parse(sessionData);
    }

    // Or if you store user info in a global variable:
    // return window.currentUser || null;

    return null; // Return null if no user logged in
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showMessage(message, type) {
    // Simple notification system - customize to match your app
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            background: ${type === "success" ? "#d4edda" : "#f8d7da"};
            color: ${type === "success" ? "#155724" : "#721c24"};
            border: 1px solid ${type === "success" ? "#c3e6cb" : "#f5c6cb"};
        `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }
}
