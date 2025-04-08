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
export function showMessage(message) {
  alert(message); // You can replace this with a more user-friendly message display.
}
