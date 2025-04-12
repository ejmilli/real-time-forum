// Updated signup.js

// Function to collect form data
export function collectSignupFormData() {
  const firstname = document.getElementById("firstname").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const nickname = document.getElementById("nickname").value.trim();
  const age = document.getElementById("age").value.trim();
  const gender = document.querySelector("input[name='gender']:checked")?.value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  return {
    firstname,
    lastname,
    nickname,
    age,
    gender,
    email,
    password,
    confirmPassword,
  };
}

// Function to validate the form data
export function validateSignupData(formData) {
  const {
    firstname,
    lastname,
    nickname,
    age,
    gender,
    email,
    password,
    confirmPassword,
  } = formData;

  // Check if any field is empty
  if (
    !firstname ||
    !lastname ||
    !nickname ||
    !age ||
    !gender ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    return "All fields are required.";
  }

  if (nickname.length < 3 || nickname.length > 16)
    return "Nickname must be between 3 and 16 characters.";
  if (!/^[\w\-]+$/.test(nickname))
    return "Nickname must contain only letters, numbers, hyphens, or underscores.";

  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 13 || ageNum > 100)
    return "Age must be between 13 and 100.";

  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    return "Please enter a valid email address.";

  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  if (password.toLowerCase() === "password")
    return "Password cannot be 'password'.";

  if (password !== confirmPassword) return "Passwords do not match.";

  return null; // return null if validation passes
}

// Function to submit the form data via fetch
export function submitSignupForm(formData) {
  // Create FormData object explicitly
  const formDataObj = new FormData();

  // Add each field to FormData
  Object.keys(formData).forEach((key) => {
    formDataObj.append(key, formData[key]);
  });

  console.log("Submitting form data:", formData); // Debug log

  return fetch("/signup", {
    method: "POST",
    body: formDataObj,
    credentials: "include",
  });
}

// Show validation error message
export function showMessage(message, isError = true) {
  console.log("Showing message:", message, "isError:", isError); // Debug log

  // Clear any existing message
  const existingMsg = document.querySelector(".message");
  if (existingMsg) {
    existingMsg.remove();
  }

  // Create a message element
  const messageEl = document.createElement("div");
  messageEl.className = `message ${isError ? "error" : "success"}`;
  messageEl.textContent = message;

  // Style the message
  messageEl.style.padding = "10px";
  messageEl.style.borderRadius = "4px";
  messageEl.style.margin = "10px 0";
  messageEl.style.fontSize = "14px";

  if (isError) {
    messageEl.style.backgroundColor = "#fef2f2";
    messageEl.style.color = "#ef4444";
    messageEl.style.border = "1px solid #fca5a5";
  } else {
    messageEl.style.backgroundColor = "#ecfdf5";
    messageEl.style.color = "#10b981";
    messageEl.style.border = "1px solid #6ee7b7";
  }

  // Insert before the submit button
  const form = document.querySelector("#signup form");
  const submitBtn = form.querySelector('button[type="submit"]');
  form.insertBefore(messageEl, submitBtn);

  // Clear message after 5 seconds if success
  if (!isError) {
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }
}
