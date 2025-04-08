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
export function showMessage(message) {
  alert(message);
}
