document.addEventListener("DOMContentLoaded", () => {
  const signupSection = document.getElementById("signup");
  const loginSection = document.getElementById("login");
  const toSignUp = document.getElementById("toSignUp");
  const toLogIn = document.getElementById("toLogIn");

  toSignUp.addEventListener("click", () => {
    signupSection.style.display = "block";
    loginSection.style.display = "none";
  });

  toLogIn.addEventListener("click", () => {
    loginSection.style.display = "block";
    signupSection.style.display = "none";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button[type='submit']").forEach((button) => {
    button.onclick = function (event) {
      event.preventDefault();

      const form = this.closest("form"); // Get the correct form
      const usernameField =
        form.querySelector("input[name='nickname']") ||
        form.querySelector("input[name='username']");
      const passwordField = form.querySelector("input[name='password']");
      const confirmPasswordField = form.querySelector(
        "input[name='confirmPassword']"
      );

      // Clear previous error messages
      form.querySelectorAll(".error-message").forEach((msg) => msg.remove());

      let hasError = false;

      // Function to show error message below input
      function showError(field, message) {
        if (!field) return;
        hasError = true;
        const error = document.createElement("div");
        error.className = "error-message";
        error.style.color = "red";
        error.style.fontSize = "12px";
        error.style.marginTop = "4px";
        error.innerText = message;
        field.parentNode.appendChild(error);
      }

      // Validate username/nickname
      if (usernameField && usernameField.value.trim() === "") {
        showError(usernameField, "Username/Nickname is required.");
      } else if (
        usernameField &&
        (usernameField.value.length < 3 || usernameField.value.length > 16)
      ) {
        showError(
          usernameField,
          "Username/Nickname must be between 3 and 16 characters."
        );
      } else if (
        usernameField &&
        !/^[a-zA-Z0-9_]+$/.test(usernameField.value)
      ) {
        showError(
          usernameField,
          "Username/Nickname can only contain letters, numbers, and underscores."
        );
      }

      // Validate password
      if (passwordField && passwordField.value.trim() === "") {
        showError(passwordField, "Password is required.");
      } else if (passwordField && passwordField.value.length < 8) {
        showError(
          passwordField,
          "Password must be at least 8 characters long."
        );
      }

      // Extra validation for Signup (Confirm Password)
      if (
        confirmPasswordField &&
        confirmPasswordField.value !== passwordField.value
      ) {
        showError(confirmPasswordField, "Passwords do not match.");
      }

      if (!hasError) {
        // Form submission logic here
        console.log("Form submitted successfully!");
      }
    };
  });
});
