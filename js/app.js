import { Router } from "./router.js";

import {
  collectSignupFormData,
  validateSignupData,
  submitSignupForm,
  showMessage as showSignupMessage,
} from "./signup.js";

import {
  collectLoginFormData,
  validateLoginData,
  submitLoginForm,
  showMessage as showLoginMessage,
} from "./login.js";

import { isAuthenticated, setAuthToken, updateNavigation } from "./auth.js";

import { loadPosts, setupPostsHandlers } from "./posts.js";

document.addEventListener("DOMContentLoaded", () => {
  const router = new Router();

  // Home route (landing page)
  router.addRoute("/", "homeTemplate");

  // Auth routes
  router.addRoute("signup", "signupTemplate", () => {
    setupSignupFormHandler(router);
  });

  router.addRoute("login", "loginTemplate", () => {
    setupLoginFormHandler(router);
  });

  // Protected routes
  router.addRoute("posts", "postsTemplate", () => {
    if (!isAuthenticated()) {
      router.navigateTo("login");
      return;
    }
    loadPosts();
    setupPostsHandlers();
  });

  // Initialize navigation based on auth state
  updateNavigation(router);

  router.start();
});

// Setup the handlers for signup form
function setupSignupFormHandler(router) {
  const form = document.querySelector("#signup form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = collectSignupFormData();
    const validationError = validateSignupData(formData);

    if (validationError) {
      showSignupMessage(validationError);
      return;
    }

    try {
      const response = await submitSignupForm(formData);
      const result = await response.json();

      if (!response.ok) {
        showSignupMessage(result.error || "Signup failed");
        return;
      }

      // Store auth token
      if (result.token) {
        setAuthToken(result.token);
        updateNavigation(router);
      }

      showSignupMessage("Signup successful!");
      router.navigateTo("posts");
    } catch (err) {
      showSignupMessage("An error occurred. Please try again.");
      console.error(err);
    }
  });
}

// Setup the handlers for login form
function setupLoginFormHandler(router) {
  const form = document.querySelector("#login form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = collectLoginFormData();
    const validationError = validateLoginData(formData);

    if (validationError) {
      showLoginMessage(validationError);
      return;
    }

    try {
      const response = await submitLoginForm(formData);
      const result = await response.json();

      if (!response.ok) {
        showLoginMessage(result.error || "Login failed");
        return;
      }

      // Store auth token
      if (result.token) {
        setAuthToken(result.token);
        updateNavigation(router);
      }

      showLoginMessage("Login successful!");
      router.navigateTo("posts");
    } catch (err) {
      showLoginMessage("An error occurred. Please try again.");
      console.error(err);
    }
  });
}
