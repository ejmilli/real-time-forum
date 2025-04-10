export function loadPosts() {
  const postsContainer = document.querySelector(".posts-container");

  // Replace this with your actual API call to load posts
  fetch("/api/posts", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load posts");
      }
      return response.json();
    })
    .then((posts) => {
      // Render posts
      postsContainer.innerHTML = posts.length
        ? posts
            .map(
              (post) => `
        <div class="post">
          <h3>${post.title}</h3>
          <p class="author">By ${post.author} on ${new Date(
                post.date
              ).toLocaleDateString()}</p>
          <p>${post.preview}... <a href="#post/${post.id}" data-post-id="${
                post.id
              }">Read more</a></p>
        </div>
      `
            )
            .join("")
        : "<p>No posts available.</p>";
    })
    .catch((error) => {
      postsContainer.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    });
}

export function setupPostsHandlers() {
  // Add any event handlers specific to the posts page
  const postsContainer = document.querySelector(".posts-container");
  if (!postsContainer) return;

  // Example: Handle click on "Read more" links
  postsContainer.addEventListener("click", (e) => {
    const readMoreLink = e.target.closest("a[data-post-id]");
    if (readMoreLink) {
      e.preventDefault();
      const postId = readMoreLink.getAttribute("data-post-id");
      // Handle viewing a single post
      // router.navigateTo(`post/${postId}`);
    }
  });
}
