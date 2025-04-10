export function isAuthenticated() {
  return localStorage.getItem("authToken") !== null;
}

export function setAuthToken(token) {
  localStorage.setItem("authToken", token);
}

export function clearAuthToken() {
  localStorage.removeItem("authToken");
}

export function updateNavigation(router) {
  const nav = document.querySelector("nav");

  if (isAuthenticated()) {
    nav.innerHTML = `
      <a href="#posts" data-page="posts">Posts</a>
      <a href="#profile" data-page="profile">Profile</a>
      <button id="logoutBtn">Logout</button>
    `;

    // Add logout handler
    document.getElementById("logoutBtn").addEventListener("click", () => {
      clearAuthToken();
      router.navigateTo("/");
      updateNavigation(router);
    });
  } else {
    nav.innerHTML = `
      <a href="#/" data-page="/">Home</a>
      <a href="#signup" data-page="signup">Sign Up</a>
      <a href="#login" data-page="login">Login</a>
    `;
  }
}
