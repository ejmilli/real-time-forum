// posts.js - Updated to match your HTML template IDs

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
function showLoading() {
  const container = document.getElementById("posts-container");
  if (container) {
    container.innerHTML = "<p>Loading posts...</p>";
  }
}

// Show error message
function showError(message) {
  const container = document.getElementById("posts-container");
  if (container) {
    container.innerHTML = `<div class="error" style="color: red; padding: 10px;">Error: ${message}</div>`;
  }
}

// Renders posts
function renderPosts(posts) {
  const container = document.getElementById("posts-container");

  if (!container) {
    console.error("posts-container not found");
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = "<p>No posts found.</p>";
    return;
  }

  container.innerHTML = "";

  posts.forEach((post) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.style.cssText =
      "border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;";

    postDiv.innerHTML = `
      <h3><a href="#post/${
        post.id
      }" style="color: #007bff; text-decoration: none;">${escapeHTML(
      post.title
    )}</a></h3>
      <p style="margin: 10px 0;">${escapeHTML(post.content)}</p>
      <small style="color: #666;">
        <span class="post-category" style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${escapeHTML(
          post.category_id
        )}</span> | 
        👍 ${post.like_count || 0} 👎 ${post.dislike_count || 0}
        <br>
        Posted: ${new Date(post.created_at).toLocaleString()}
      </small>
    `;

    container.appendChild(postDiv);
  });
}

// Submit a new post
async function submitPost() {
  console.log("Submitting post...");

  const titleEl = document.getElementById("title");
  const contentEl = document.getElementById("content");
  const categoryEl = document.getElementById("category-select");
  const submitBtn = document.getElementById("submit-post");

  if (!titleEl || !contentEl || !categoryEl) {
    console.error("Required form elements not found!");
    alert("Form elements missing - check your HTML template");
    return;
  }

  const title = titleEl.value.trim();
  const content = contentEl.value.trim();
  const category = categoryEl.value;

  console.log("Form values:", { title, content, category });

  if (!title || !content || !category) {
    alert("Please fill in all fields.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";
  }

  try {
    console.log("Sending POST request to /api/posts");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title,
        content,
        category_id: category,
      }),
    });

    console.log("POST response status:", res.status);

    if (res.ok) {
      const newPost = await res.json();
      console.log("Post created successfully:", newPost);

      // Clear form
      titleEl.value = "";
      contentEl.value = "";
      categoryEl.selectedIndex = 0;

      // Refresh posts list
      const currentCategory = getCurrentCategory();
      console.log("Refreshing posts for category:", currentCategory);
      await getPostsByCategory(currentCategory);

      alert("Post created successfully!");
    } else {
      const errorText = await res.text();
      console.error("Failed to create post:", errorText);
      alert(`Failed to create post: ${errorText}`);
    }
  } catch (err) {
    console.error("Error submitting post:", err);
    alert("An error occurred while creating the post.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post";
    }
  }
}

// Get currently selected category
function getCurrentCategory() {
  const activeCategory = document.querySelector("#category-list li.active");
  return activeCategory ? activeCategory.getAttribute("data-category") : "all";
}

// Set active category in sidebar
function setActiveCategory(category) {
  // Remove active class from all categories
  document.querySelectorAll("#category-list li").forEach((li) => {
    li.classList.remove("active");
  });

  // Add active class to selected category
  const targetCategory = document.querySelector(
    `#category-list li[data-category="${category}"]`
  );
  if (targetCategory) {
    targetCategory.classList.add("active");
  }
}

// Fetch and show posts by category
async function getPostsByCategory(category = "all") {
  console.log("Fetching posts for category:", category);
  showLoading();

  try {
    const url =
      category && category !== "all"
        ? `/api/posts?category=${encodeURIComponent(category)}`
        : "/api/posts";

    console.log("Fetching from URL:", url);

    const res = await fetch(url, {
      credentials: "include",
    });

    console.log("GET response status:", res.status);

    if (res.ok) {
      const posts = await res.json();
      console.log("Received posts:", posts);
      renderPosts(posts);
      setActiveCategory(category);
    } else if (res.status === 401) {
      console.log("Unauthorized - redirecting to login");
      showError("You need to be logged in to view posts.");
      window.location.hash = "login";
    } else {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      showError(`Failed to load posts: ${errorText}`);
    }
  } catch (err) {
    console.error("Network error:", err);
    showError("Network error occurred while loading posts.");
  }
}

// Set up post creation and category filtering
export function setupPostsPage() {
  console.log("Setting up posts page...");

  // Small delay to ensure DOM is ready
  setTimeout(() => {
    const submitBtn = document.getElementById("submit-post");
    const categoryList = document.getElementById("category-list");

    console.log("Elements found:", {
      submitBtn: !!submitBtn,
      categoryList: !!categoryList,
    });

    // Set up post submission
    if (submitBtn) {
      submitBtn.addEventListener("click", submitPost);
      console.log("Submit button listener added");
    } else {
      console.error("submit-post button not found!");
    }

    // Set up category filtering
    if (categoryList) {
      categoryList.addEventListener("click", (e) => {
        if (
          e.target.tagName === "LI" &&
          e.target.hasAttribute("data-category")
        ) {
          const selectedCategory = e.target.getAttribute("data-category");
          console.log("Category clicked:", selectedCategory);
          getPostsByCategory(selectedCategory);
        }
      });
      console.log("Category list listener added");
    } else {
      console.error("category-list not found!");
    }

    // Initial load - get all posts
    console.log("Starting initial load");
    getPostsByCategory("all");
  }, 100);
}
