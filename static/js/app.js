// Save this as js/app.js
import { Router } from "./router.js";

document.addEventListener("DOMContentLoaded", () => {
  const router = new Router();

  // Home route (landing page)
  router.addRoute("/", "homeTemplate");

  // Auth routes
  router.addRoute("signup", "signupTemplate", () => {
    setupSignupForm();
  });

  router.addRoute("login", "loginTemplate", () => {
    setupLoginForm();
  });

  router.start();
});

function setupSignupForm() {
  console.log("Setting up signup form");
  const form = document.querySelector("#form");

  if (!form) {
    console.error("Signup form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    // Create FormData object directly from form
    const formData = new FormData(form);

    // Log all form fields (except password)
    console.log("Form data collected:");
    for (const [name, value] of formData.entries()) {
      if (name !== "password" && name !== "confirmPassword") {
        console.log(`  ${name}: ${value}`);
      } else {
        console.log(`  ${name}: [HIDDEN]`);
      }
    }

    try {
      const response = await fetch("/signup", {
        method: "POST",
        body: formData,
      });

      const result = await response.text();
      console.log("Server response:", result);

      if (response.ok) {
        showMessage("Signup successful! Redirecting to login...", false);

        // Redirect to login after successful signup
        setTimeout(() => {
          window.location.hash = "#login";
        }, 2000);
      } else {
        showMessage(result || "Signup failed", true);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      showMessage("An error occurred. Please try again.", true);
    }
  });
}

function setupLoginForm() {
  console.log("Setting up login form");
  const form = document.querySelector("#login form");

  if (!form) {
    console.error("Login form not found");
    return;
  }

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
    console.log("Login form submitted");

    const formData = new FormData(form);

    try {
      const response = await fetch("/login", {
        method: "POST",
        body: formData,
      });

      const result = await response.text();

      if (response.ok) {
        showMessage("Login successful! Redirecting...", false);

        // Redirect to posts page after successful login
        setTimeout(() => {
          window.location.hash = "#posts";
        }, 1500);
      } else {
        showMessage(result || "Login failed", true);
      }
    } catch (error) {
      console.error("Error during login:", error);
      showMessage("An error occurred. Please try again.", true);
    }
  });
}

function showMessage(message, isError = true) {
  // Remove any existing message
  const existingMsg = document.querySelector(".message");
  if (existingMsg) existingMsg.remove();

  // Create message element
  const msgElement = document.createElement("div");
  msgElement.className = `message ${isError ? "error" : "success"}`;
  msgElement.textContent = message;

  // Style the message
  msgElement.style.padding = "10px";
  msgElement.style.margin = "10px 0";
  msgElement.style.borderRadius = "5px";

  if (isError) {
    msgElement.style.backgroundColor = "#ffdddd";
    msgElement.style.color = "#ff0000";
    msgElement.style.border = "1px solid #ff0000";
  } else {
    msgElement.style.backgroundColor = "#ddffdd";
    msgElement.style.color = "#008800";
    msgElement.style.border = "1px solid #008800";
  }

  // Add to the appropriate form
  const currentPage = window.location.hash.substring(1);
  if (currentPage === "signup") {
    const form = document.getElementById("form");
    if (form)
      form
        .querySelector('button[type="submit"]')
        .insertAdjacentElement("beforebegin", msgElement);
  } else if (currentPage === "login") {
    const form = document.querySelector("#login form");
    if (form)
      form
        .querySelector('button[type="submit"]')
        .insertAdjacentElement("beforebegin", msgElement);
  }

  // Auto dismiss success messages
  if (!isError) {
    setTimeout(() => {
      msgElement.remove();
    }, 5000);
  }
}
