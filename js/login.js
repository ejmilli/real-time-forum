// Function to collect login form data
export function collectLoginFormData() {
  const loginType = document.querySelector(
    "input[name='loginType']:checked"
  ).value;
  const loginValue =
    loginType === "nickname"
      ? document.getElementById("nickname").value
      : document.getElementById("email").value;
  const password = document.getElementById("password").value;

  return { loginType, loginValue, password };
}

// Function to validate login form data
export function validateLoginData(formData) {
  const { loginType, loginValue, password } = formData;

  if (loginValue.trim() === "") return `${loginType} is required.`;
  if (loginType === "nickname" && loginValue.length < 3)
    return "Nickname must be at least 3 characters long.";
  if (
    loginType === "email" &&
    !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(loginValue)
  ) {
    return "Please enter a valid email address.";
  }

  if (password.trim() === "") return "Password is required.";
  if (password.length <= 7)
    return "Password must be at least 8 characters long.";
  if (password.toLowerCase() === "password")
    return "Password cannot be 'password'.";

  return null; // Return null if validation passes
}

// Function to submit the login form
export function submitLoginForm(formData) {
  const formDataObject = new FormData();
  Object.keys(formData).forEach((key) =>
    formDataObject.append(key, formData[key])
  );

  return fetch("/login", {
    method: "POST",
    credentials: "include",
    body: formDataObject,
  });
}

// Show validation error message
export function showMessage(message, isError = true) {
  // Check if message element exists, if not, create it
  let messageEl = document.querySelector("#login .message");

  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.className = "message";
    const form = document.querySelector("#login form");
    form.insertBefore(messageEl, form.querySelector('button[type="submit"]'));
  }

  messageEl.textContent = message;
  messageEl.className = `message ${isError ? "error" : "success"}`;

  // Add CSS if not already in stylesheet
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
