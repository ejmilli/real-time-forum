const pageTitle = "Forum";

// Map routes to templates and metadata
const Routes = {
  login: {
    templateId: "loginTemplate",
    title: "Login | " + pageTitle,
    description: "Login to the forum",
  },
  signup: {
    templateId: "signupTemplate",
    title: "Sign Up | " + pageTitle,
    description: "Create a new forum account",
  },
  posts: {
    templateId: "postTemplate",
    title: "Posts | " + pageTitle,
    description: "Browse forum posts",
  },
  chat: {
    templateId: "chatTemplate",
    title: "Chat | " + pageTitle,
    description: "Chat with users",
  },
  "/": {
    templateId: null, // default welcome section
    title: pageTitle,
    description: "Welcome to the forum",
  },
  404: {
    templateId: null,
    title: "404 | " + pageTitle,
    description: "Page not found",
  },
};

// Handle navigation clicks
document.addEventListener("click", (e) => {
  const target = e.target.closest("a[data-link]");
  if (!target) return;

  e.preventDefault();
  const path = target.getAttribute("href").replace("#", "");
  window.location.hash = path;
});

// Load route content
const locationHandler = async () => {
  let location = window.location.hash.replace("#", "");
  if (location.length === 0) {
    location = "/";
  }

  const route = Routes[location] || Routes[404];

  const main = document.querySelector("main");
  main.innerHTML = ""; // Clear existing content

  if (route.templateId) {
    const template = document.getElementById(route.templateId);
    if (template) {
      const clone = template.content.cloneNode(true);
      main.appendChild(clone);
    }
  } else {
    // Show default welcome section or 404 message
    document.getElementById("welcomeMessage").style.display =
      location === "/" ? "block" : "none";
  }

  document.title = route.title;
  document
    .querySelector("meta[name=description]")
    .setAttribute("content", route.description);
};

window.addEventListener("hashchange", locationHandler);
window.addEventListener("DOMContentLoaded", locationHandler); // on page load
