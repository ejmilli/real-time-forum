// post-details.js - Post details page functionality

// Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, function (match) {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return escapeMap[match];
  });
}

// Show loading state
function showPostLoading() {
  const postContainer = document.getElementById("post-details");
  const commentsContainer = document.getElementById("comments-container");

  if (postContainer) {
    postContainer.innerHTML = "<p>Loading post...</p>";
  }

  if (commentsContainer) {
    commentsContainer.innerHTML = "<p>Loading comments...</p>";
  }
}

// Show error message
function showPostError(message) {
  const postContainer = document.getElementById("post-details");
  if (postContainer) {
    postContainer.innerHTML = `<div class="error" style="color: red; padding: 10px;">Error: ${message}</div>`;
  }
}

// Fetch and display post details with comments
async function getPostDetails(postId) {
  console.log("Fetching post details for ID:", postId);
  showPostLoading();

  try {
    const res = await fetch(
      `/api/posts/details?id=${encodeURIComponent(postId)}`,
      {
        credentials: "include",
      }
    );

    console.log("Post details response status:", res.status);

    if (res.ok) {
      const data = await res.json();
      console.log("Received post data:", data);
      renderPostDetails(data.post, data.comments);
    } else if (res.status === 401) {
      console.log("Unauthorized - redirecting to login");
      showPostError("You need to be logged in to view this post.");
      window.location.hash = "login";
    } else if (res.status === 404) {
      showPostError("Post not found.");
    } else {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      showPostError(`Failed to load post: ${errorText}`);
    }
  } catch (err) {
    console.error("Network error:", err);
    showPostError("Network error occurred while loading post details.");
  }
}

// Render post details and comments
function renderPostDetails(post, comments) {
  const postContainer = document.getElementById("post-details");
  const commentsContainer = document.getElementById("comments-container");

  if (!postContainer || !commentsContainer) {
    console.error("Post details containers not found");
    return;
  }

  // Render post
  postContainer.innerHTML = `
    <div class="post-detail">
      <h2>${escapeHTML(post.title)}</h2>
      <div class="post-meta">
        <span class="post-category" style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin-right: 10px;">
          ${escapeHTML(post.category_id)}
        </span>
        <span class="post-stats">
          👍 ${post.like_count || 0} 👎 ${post.dislike_count || 0}
        </span>
      </div>
      <div class="post-content" style="margin: 15px 0; line-height: 1.6;">
        ${escapeHTML(post.content)}
      </div>
      <div class="post-footer" style="color: #666; font-size: 0.9em;">
        Posted: ${new Date(post.created_at).toLocaleString()}
      </div>
    </div>
  `;

  // Render comments
  if (!comments || comments.length === 0) {
    commentsContainer.innerHTML =
      "<p>No comments yet. Be the first to comment!</p>";
  } else {
    commentsContainer.innerHTML = comments
      .map(
        (comment) => `
        <div class="comment" style="border-left: 3px solid #007bff; padding-left: 15px; margin: 15px 0;">
          <div class="comment-body" style="margin-bottom: 5px;">
            ${escapeHTML(comment.body)}
          </div>
          <div class="comment-footer" style="color: #666; font-size: 0.8em;">
            User: ${escapeHTML(comment.user_id)} - ${new Date(
          comment.created_at
        ).toLocaleString()}
          </div>
        </div>
      `
      )
      .join("");
  }
}

// Submit a new comment
async function submitComment(postId) {
  console.log("Submitting comment for post:", postId);

  const commentTextEl = document.getElementById("comment-text");
  const submitBtn = document.getElementById("submit-comment");

  if (!commentTextEl) {
    console.error("Comment text element not found!");
    alert("Comment form not found - check your HTML template");
    return;
  }

  const commentText = commentTextEl.value.trim();

  if (!commentText) {
    alert("Please enter a comment.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";
  }

  try {
    console.log("Sending POST request to /api/comments/create");
    const res = await fetch("/api/comments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        post_id: postId,
        body: commentText,
      }),
    });

    console.log("Comment response status:", res.status);

    if (res.ok) {
      const newComment = await res.json();
      console.log("Comment created successfully:", newComment);

      // Clear comment field
      commentTextEl.value = "";

      // Refresh post details to show new comment
      await getPostDetails(postId);

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.style.cssText =
        "background: #d4edda; color: #155724; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #c3e6cb;";
      successMsg.textContent = "Comment posted successfully!";

      const commentForm = document.querySelector(".comment-form");
      if (commentForm) {
        commentForm.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }
    } else {
      const errorText = await res.text();
      console.error("Failed to create comment:", errorText);
      alert(`Failed to post comment: ${errorText}`);
    }
  } catch (err) {
    console.error("Error submitting comment:", err);
    alert("An error occurred while posting the comment.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post Comment";
    }
  }
}

// Set up category filtering for post details page
function setupCategoryFiltering() {
  const categoryList = document.getElementById("category-list");

  if (!categoryList) {
    console.error("Category list not found");
    return;
  }

  categoryList.addEventListener("click", (e) => {
    if (e.target.tagName === "LI" && e.target.hasAttribute("data-category")) {
      const selectedCategory = e.target.getAttribute("data-category");
      console.log(
        "Category clicked from post details, navigating to posts with category:",
        selectedCategory
      );

      // Navigate back to posts with the selected category
      if (selectedCategory === "all") {
        window.location.hash = "posts";
      } else {
        window.location.hash = `posts?category=${selectedCategory}`;
      }
    }
  });
}

// Set up back button functionality
function setupBackButton() {
  const backLink = document.querySelector(".back-link");

  if (backLink) {
    backLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Back button clicked, navigating to posts");
      window.location.hash = "posts";
    });
  }
}

// Main setup function for post details page
export function setupPostDetailsPage(postId) {
  console.log("Setting up post details page for ID:", postId);

  // Small delay to ensure DOM is ready
  setTimeout(() => {
    const submitBtn = document.getElementById("submit-comment");

    console.log("Elements found:", {
      submitBtn: !!submitBtn,
      postContainer: !!document.getElementById("post-details"),
      commentsContainer: !!document.getElementById("comments-container"),
    });

    // Set up comment submission
    if (submitBtn) {
      // Remove any existing listeners
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

      newSubmitBtn.addEventListener("click", () => {
        submitComment(postId);
      });
      console.log("Comment submit button listener added");
    } else {
      console.error("submit-comment button not found!");
    }

    // Set up category filtering
    setupCategoryFiltering();

    // Set up back button
    setupBackButton();

    // Load the post details
    console.log("Starting to load post details");
    getPostDetails(postId);
  }, 100);
}
