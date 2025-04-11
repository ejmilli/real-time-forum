// Function to collect form data
export function collectSignupFormData() {
  const firstname = document.getElementById("firstname").value;
  const lastname = document.getElementById("lastname").value;
  const nickname = document.getElementById("nickname").value;
  const age = document.getElementById("age").value;
  const gender = document.querySelector("input[name='gender']:checked")?.value;
  const email = document.getElementById("email").value;
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

  if (firstname.trim() === "") return "First name is required.";
  if (lastname.trim() === "") return "Last name is required.";
  if (nickname.trim() === "") return "Nickname is required.";
  if (nickname.length < 3 || nickname.length > 16)
    return "Nickname must be between 3 and 16 characters.";
  if (!/^[\w\-]+$/.test(nickname))
    return "Nickname must contain only letters, numbers, hyphens, or underscores.";
  if (age < 13 || age > 100) return "Age must be between 13 and 100.";
  if (!gender) return "Gender is required.";
  if (email.trim() === "") return "Email is required.";
  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    return "Please enter a valid email address.";
  if (password.trim() === "") return "Password is required.";
  if (password.length <= 7)
    return "Password must be at least 8 characters long.";
  if (password.toLowerCase() === "password")
    return "Password cannot be 'password'.";
  if (confirmPassword.trim() === "") return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";

  return null; // return null if validation passes
}

// Function to submit the form data via fetch
export function submitSignupForm(formData) {
  const formDataObject = new FormData();
  Object.keys(formData).forEach((key) =>
    formDataObject.append(key, formData[key])
  );

  return fetch("/signup", {
    method: "POST",
    credentials: "include",
    body: formDataObject,
  });
}

// Show validation error message
export function showMessage(message, isError = true) {
  // create a meesage element
  let messageEl = document.querySelector("#signup .message");

  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.className = "message";
    const form = document.querySelector("#signup form");
    form.insertBefore(messageEl, form.querySelector('button[type="submit"]'));
  }

  messageEl.textContent = message;
  messageEl.className = `message ${isError ? "error" : "success"}`;

  const style = document.createElement("style");
  style.textContent = `
    .message {
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      font-size: 14px;
    }
    .message.error {
      background-color: #fef2f2;
      color: #ef4444;
      border: 1px solid #fca5a5;
    }
    .message.success {
      background-color: #ecfdf5;
      color: #10b981;
      border: 1px solid #6ee7b7;
    }
  `;
  document.head.appendChild(style);

  // Clear message after 5 seconds if success
  if (!isError) {
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }
}
