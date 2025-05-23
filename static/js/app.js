// app.js - Clean integrated version
import { Router } from "./router.js";
import { isAuthenticated, logout, getCurrentUser } from "./auth.js";

let router;
let postsManager;

document.addEventListener("DOMContentLoaded", () => {
  router = new Router();
  postsManager = new PostsManager(router);

  // Home route
  router.addRoute("/", "homeTemplate", () => {
    updateNavigation();
  });

  // Auth routes
  router.addRoute("signup", "signupTemplate", () => {
    setupSignupForm();
    updateNavigation();
  });

  router.addRoute("login", "loginTemplate", () => {
    setupLoginForm();
    updateNavigation();
  });

  // Posts routes - handled by PostsManager
  router.addRoute("posts", "postsTemplate", async () => {
    if (await checkAuthAndRedirect()) {
      await postsManager.renderPostsList();
      updateNavigation();
    }
  });

  router.addRoute("posts/create", "postsTemplate", async () => {
    if (await checkAuthAndRedirect()) {
      await postsManager.renderCreatePost();
      updateNavigation();
    }
  });

  router.addRoute(
    "posts/category/:category",
    "postsTemplate",
    async (params) => {
      if (await checkAuthAndRedirect()) {
        await postsManager.renderPostsList(params.category);
        updateNavigation();
      }
    }
  );

  router.addRoute("posts/view/:id", "postsTemplate", async (params) => {
    if (await checkAuthAndRedirect()) {
      await postsManager.renderPostView(params.id);
      updateNavigation();
    }
  });

  // Profile route
  router.addRoute("profile", "profileTemplate", async () => {
    if (await checkAuthAndRedirect()) {
      await renderProfile();
      updateNavigation();
    }
  });

  router.start();
  updateNavigation();
});

// Authentication check
async function checkAuthAndRedirect() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    router.navigateTo("login");
    showMessage("Please log in to access this page", true);
    return false;
  }
  return true;
}

// Setup forms
function setupSignupForm() {
  const form = document.querySelector("#form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const response = await fetch("/signup", {
        method: "POST",
        body: formData,
      });

      const result = await response.text();

      if (response.ok) {
        showMessage("Signup successful! Redirecting to login...", false);
        setTimeout(() => router.navigateTo("login"), 2000);
      } else {
        showMessage(result || "Signup failed", true);
      }
    } catch (error) {
      console.error("Signup error:", error);
      showMessage("An error occurred. Please try again.", true);
    }
  });
}

function setupLoginForm() {
  const form = document.querySelector("#login form");
  if (!form) return;

  // Handle login type toggle
  const nicknameRadio = form.querySelector("#nicknameRadio");
  const emailRadio = form.querySelector("#emailRadio");
  const nicknameInput = form.querySelector("#nicknameInput");
  const emailInput = form.querySelector("#emailInput");

  if (nicknameRadio && emailRadio) {
    nicknameRadio.checked = true;
    emailInput.style.display = "none";

    nicknameRadio.addEventListener("change", () => {
      nicknameInput.style.display = "block";
      emailInput.style.display = "none";
    });

    emailRadio.addEventListener("change", () => {
      nicknameInput.style.display = "none";
      emailInput.style.display = "block";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginType = form.querySelector(
      'input[name="loginType"]:checked'
    ).value;
    const nickname =
      loginType === "nickname"
        ? form.querySelector("#nickname").value.trim()
        : "";
    const email =
      loginType === "email" ? form.querySelector("#email").value.trim() : "";
    const password = form.querySelector("#password").value;

    // Validation
    if (loginType === "nickname" && !nickname) {
      showMessage("Nickname is required", true);
      return;
    }
    if (loginType === "email" && !email) {
      showMessage("Email is required", true);
      return;
    }
    if (!password) {
      showMessage("Password is required", true);
      return;
    }

    const formData = new URLSearchParams();
    formData.append("loginType", loginType);
    formData.append("nickname", nickname);
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: formData.toString(),
      });

      const result = await response.text();

      if (response.ok) {
        showMessage("Login successful! Redirecting...", false);
        await updateNavigation();
        setTimeout(() => router.navigateTo("posts"), 1500);
      } else {
        showMessage(result || "Login failed", true);
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage("An error occurred. Please try again.", true);
    }
  });
}

// Navigation
async function updateNavigation() {
  const nav = document.querySelector("nav");
  const authenticated = await isAuthenticated();

  if (authenticated) {
    const user = await getCurrentUser();
    const username = user ? user.nickname : "User";

    nav.innerHTML = `
      <div class="nav-left">
        <a href="#posts" data-page="posts">Posts</a>
        <a href="#posts/create" data-page="posts/create">Create Post</a>
      </div>
      <div class="nav-right">
        <span class="username">Welcome, ${username}!</span>
        <a href="#profile" data-page="profile">Profile</a>
        <button id="logoutBtn">Logout</button>
      </div>
    `;

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      try {
        await logout();
        router.navigateTo("/");
        await updateNavigation();
        showMessage("Logged out successfully", false);
      } catch (error) {
        console.error("Logout error:", error);
        showMessage("Error logging out", true);
      }
    });
  } else {
    nav.innerHTML = `
      <a href="#/" data-page="/">Home</a>
      <a href="#signup" data-page="signup">Sign Up</a>
      <a href="#login" data-page="login">Login</a>
    `;
  }
}

// Profile page
async function renderProfile() {
  const user = await getCurrentUser();
  const container = document.querySelector("main");

  if (!user) {
    container.innerHTML = '<div class="error">Unable to load profile</div>';
    return;
  }

  container.innerHTML = `
    <div class="profile-container">
      <h2>My Profile</h2>
      <div class="profile-info">
        <p><strong>Nickname:</strong> ${user.nickname}</p>
        <p><strong>Email:</strong> ${user.email || "Not provided"}</p>
        <p><strong>Joined:</strong> ${new Date(
          user.created_at
        ).toLocaleDateString()}</p>
      </div>
      
      <div class="profile-actions">
        <button class="btn btn-primary" onclick="router.navigateTo('posts')">View My Posts</button>
        <button class="btn btn-secondary" onclick="router.navigateTo('posts/create')">Create New Post</button>
      </div>
    </div>
  `;
}

// Message system
function showMessage(message, isError = true) {
  const existingMsg = document.querySelector(".message");
  if (existingMsg) existingMsg.remove();

  const msgElement = document.createElement("div");
  msgElement.className = `message ${isError ? "error" : "success"}`;
  msgElement.textContent = message;
  msgElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 1000;
    font-weight: 500;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: ${isError ? "#fee" : "#efe"};
    color: ${isError ? "#c33" : "#060"};
    border: 1px solid ${isError ? "#fcc" : "#cfc"};
  `;

  document.body.appendChild(msgElement);
  setTimeout(() => msgElement.remove(), isError ? 5000 : 3000);
}

// PostsManager Class
class PostsManager {
  constructor(router) {
    this.router = router;
    this.currentCategory = "";
    this.posts = [];
    this.currentPost = null;
    this.comments = [];
  }

  async renderPostsList(category = "") {
    this.currentCategory = category;
    const container = document.querySelector("main");
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
          <button class="btn btn-primary create-post-btn">Create New Post</button>
        </div>
        
        <div class="category-filters">
          <button class="category-btn ${
            !this.currentCategory ? "active" : ""
          }" data-category="">All</button>
          <button class="category-btn ${
            this.currentCategory === "general" ? "active" : ""
          }" data-category="general">General</button>
          <button class="category-btn ${
            this.currentCategory === "tech" ? "active" : ""
          }" data-category="tech">Tech</button>
          <button class="category-btn ${
            this.currentCategory === "gaming" ? "active" : ""
          }" data-category="gaming">Gaming</button>
          <button class="category-btn ${
            this.currentCategory === "sports" ? "active" : ""
          }" data-category="sports">Sports</button>
        </div>
        
        <div id="posts-list" class="posts-list">
          <div class="loading">Loading posts...</div>
        </div>
      </div>
    `;
  }

  async renderCreatePost() {
    const container = document.querySelector("main");
    container.innerHTML = this.getCreatePostTemplate();
    this.setupCreatePostListeners();
  }

  getCreatePostTemplate() {
    return `
      <div class="create-post-container">
        <div class="create-post-header">
          <h2>Create New Post</h2>
          <button class="btn btn-secondary back-to-posts-btn">Back to Posts</button>
        </div>
        
        <form id="create-post-form" class="post-form">
          <div class="form-group">
            <label for="post-title">Title *</label>
            <input type="text" id="post-title" name="title" required placeholder="Enter post title...">
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
            <textarea id="post-content" name="content" required placeholder="Write your post content..." rows="8"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Create Post</button>
            <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;
  }

  async renderPostView(postId) {
    const container = document.querySelector("main");
    container.innerHTML = '<div class="loading">Loading post...</div>';

    try {
      const response = await fetch(`/api/posts/comments?id=${postId}`, {
        credentials: "include",
      });

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
          <button class="btn btn-secondary back-to-posts-btn">← Back to Posts</button>
        </div>
        
        <article class="post-detail">
          <header class="post-header">
            <h1>${this.escapeHtml(this.currentPost.title)}</h1>
            <div class="post-meta">
              <span class="category">${this.currentPost.category_id}</span>
              <span class="date">${this.formatDate(
                this.currentPost.created_at
              )}</span>
              <div class="post-reactions">
                <button class="reaction-btn like-btn">👍 ${
                  this.currentPost.like_count || 0
                }</button>
                <button class="reaction-btn dislike-btn">👎 ${
                  this.currentPost.dislike_count || 0
                }</button>
              </div>
            </div>
          </header>
          
          <div class="post-content">
            ${this.escapeHtml(this.currentPost.content).replace(/\n/g, "<br>")}
          </div>
        </article>
        
        <section class="comments-section">
          <h3>Comments (${this.comments.length})</h3>
          
          <form id="comment-form" class="comment-form">
            <textarea id="comment-body" name="body" required placeholder="Write a comment..." rows="3"></textarea>
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
          <span class="comment-author">${comment.user_nickname || "User"}</span>
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
      const url = category ? `/api/posts?category=${category}` : `/api/posts`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) throw new Error("Failed to fetch posts");

      this.posts = await response.json();
      this.renderPostsListUpdate();
    } catch (error) {
      document.getElementById(
        "posts-list"
      ).innerHTML = `<div class="error">Error loading posts: ${error.message}</div>`;
    }
  }

  renderPostsListUpdate() {
    const postsContainer = document.getElementById("posts-list");

    if (this.posts.length === 0) {
      postsContainer.innerHTML = '<div class="no-posts">No posts found.</div>';
      return;
    }

    postsContainer.innerHTML = this.posts
      .map(
        (post) => `
      <article class="post-card" data-post-id="${post.id}">
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
          <span class="post-author">by ${
            post.user_nickname || "Anonymous"
          }</span>
          <span class="post-date">${this.formatDate(post.created_at)}</span>
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
      const postData = {
        title: formData.get("title"),
        content: formData.get("content"),
        category_id: formData.get("category_id") || "general",
      };

      const response = await fetch(`/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        this.router.navigateTo("posts");
        showMessage("Post created successfully!", false);
      } else {
        const error = await response.text();
        throw new Error(error || "Failed to create post");
      }
    } catch (error) {
      showMessage(`Error creating post: ${error.message}`, true);
    }
  }

  async addComment(postId, commentBody) {
    try {
      const commentData = {
        post_id: postId,
        body: commentBody,
      };

      const response = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(commentData),
      });

      if (response.ok) {
        const newComment = await response.json();
        this.comments.push(newComment);
        document.getElementById("comments-list").innerHTML =
          this.renderComments();
        document.getElementById("comment-form").reset();
        showMessage("Comment added successfully!", false);
      } else {
        const error = await response.text();
        throw new Error(error || "Failed to add comment");
      }
    } catch (error) {
      showMessage(`Error adding comment: ${error.message}`, true);
    }
  }

  // Event Listeners
  setupPostsListeners() {
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category;
        this.filterByCategory(category);
      });
    });

    document
      .querySelector(".create-post-btn")
      ?.addEventListener("click", () => {
        this.router.navigateTo("posts/create");
      });

    document.querySelectorAll(".post-card").forEach((card) => {
      card.addEventListener("click", () => {
        const postId = card.dataset.postId;
        this.router.navigateTo(`posts/view/${postId}`);
      });
    });
  }

  setupCreatePostListeners() {
    const form = document.getElementById("create-post-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      await this.createPost(formData);
    });

    document
      .querySelector(".back-to-posts-btn")
      ?.addEventListener("click", () => {
        this.router.navigateTo("posts");
      });

    document.querySelector(".cancel-btn")?.addEventListener("click", () => {
      this.router.navigateTo("posts");
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

    document
      .querySelector(".back-to-posts-btn")
      ?.addEventListener("click", () => {
        this.router.navigateTo("posts");
      });
  }

  filterByCategory(category) {
    if (category) {
      this.router.navigateTo(`posts/category/${category}`);
    } else {
      this.router.navigateTo("posts");
    }
  }

  // Utility Methods
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
}

// Export for debugging
window.postsManager = postsManager;
