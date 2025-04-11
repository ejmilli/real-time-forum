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
      // For development, simulate a successful signup
      // In production, this would be an actual API call
      setTimeout(() => {
        setAuthToken("fake-auth-token");
        updateNavigation(router);
        showSignupMessage("Signup successful!");
        router.navigateTo("posts");
      }, 1000);

      /* Uncomment for production
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
      */
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

  // Handle login type toggle
  const nicknameRadio = form.querySelector("#nicknameRadio");
  const emailRadio = form.querySelector("#emailRadio");
  const nicknameInput = form.querySelector("#nicknameInput");
  const emailInput = form.querySelector("#emailInput");

  if (nicknameRadio && emailRadio) {
    nicknameRadio.addEventListener("change", () => {
      nicknameInput.style.display = "block";
      emailInput.style.display = "none";
    });

    emailRadio.addEventListener("change", () => {
      nicknameInput.style.display = "none";
      emailInput.style.display = "block";
    });

    // Set default
    nicknameRadio.checked = true;
    emailInput.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = collectLoginFormData();
    const validationError = validateLoginData(formData);

    if (validationError) {
      showLoginMessage(validationError);
      return;
    }

    try {
      // For development, simulate a successful login
      // In production, this would be an actual API call
      setTimeout(() => {
        setAuthToken("fake-auth-token");
        updateNavigation(router);
        showLoginMessage("Login successful!");
        router.navigateTo("posts");
      }, 1000);

      /* Uncomment for production
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
      */
    } catch (err) {
      showLoginMessage("An error occurred. Please try again.");
      console.error(err);
    }
  });
}
