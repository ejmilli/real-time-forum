// Save this as js/login.js
export function collectLoginFormData() {
  const loginType = document.querySelector(
    'input[name="loginType"]:checked'
  )?.value;
  const nickname = document.getElementById("nickname")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  return {
    loginType,
    nickname: loginType === "nickname" ? nickname : "",
    email: loginType === "email" ? email : "",
    password,
  };
}

export function validateLoginData(formData) {
  const { loginType, nickname, email, password } = formData;

  if (!loginType) {
    return "Please select a login method (nickname or email)";
  }

  if (loginType === "nickname" && !nickname) {
    return "Nickname is required";
  }

  if (loginType === "email" && !email) {
    return "Email is required";
  }

  if (!password) {
    return "Password is required";
  }

  return null; // Validation passed
}

export function submitLoginForm(formData) {
  // Create FormData object
  const form = new FormData();

  form.append("loginType", formData.loginType);
  form.append("nickname", formData.nickname);
  form.append("email", formData.email);
  form.append("password", formData.password);

  return fetch("/login", {
    method: "POST",
    body: form,
  });
}

export function showMessage(message, isError = true) {
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
  } else {
    msgElement.style.backgroundColor = "#ddffdd";
    msgElement.style.color = "#008800";
  }

  // Add to login form
  const form = document.querySelector("#login form");
  form
    .querySelector('button[type="submit"]')
    .insertAdjacentElement("beforebegin", msgElement);

  // Auto dismiss success messages
  if (!isError) {
    setTimeout(() => {
      msgElement.remove();
    }, 5000);
  }
}
