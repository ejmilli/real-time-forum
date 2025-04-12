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

import { updateNavigation } from "./auth.js";

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
async function setupSignupFormHandler(router) {
  const form = document.querySelector("#signup form");
  if (!form) {
    console.error("Signup form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted"); // Debug log

    // Collect form data
    const formData = collectSignupFormData();
    console.log("Collected form data:", formData); // Debug log

    // Validate form data
    const validationError = validateSignupData(formData);
    console.log("Validation error:", validationError); // Debug log

    if (validationError) {
      showSignupMessage(validationError);
      return;
    }

    try {
      console.log("Attempting to submit form"); // Debug log
      const response = await submitSignupForm(formData);
      console.log("Response status:", response.status); // Debug log

      const result = await response.text();
      console.log("Response text:", result); // Debug log

      if (!response.ok) {
        throw new Error(result || "Signup failed");
      }

      showSignupMessage("Signup successful!", false);

      // Navigate to login page after success
      setTimeout(() => {
        router.navigateTo("login");
      }, 1500);
    } catch (error) {
      console.error("Error during signup:", error); // Debug log
      showSignupMessage(error.message);
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
  });
}
