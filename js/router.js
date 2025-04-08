export class Router {
  constructor() {
    this.routes = {}; // Stores routes and their associated templates
    this.currentRoute = null; // Keeps track of the current route
    this.initEventListeners(); // Initialize event listeners for navigation
  }

  initEventListeners() {
    window.addEventListener("popstate", () => {
      this.loadRoute(window.location.hash); // Hash-based routing
    });

    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-page]");
      if (link) {
        e.preventDefault();
        const page = link.getAttribute("data-page");
        this.navigateTo(page); // Update URL with hash
      }
    });
  }

  // Add a route with path, templateId, and optional callback
  addRoute(path, templateId, callback) {
    this.routes[path] = { templateId, callback };
  }

  // Navigate to a specific route and push state
  navigateTo(path, data = {}) {
    window.history.pushState({}, "", `#${path}`); // Use hash-based navigation
    this.loadRoute(path, data); // Load the corresponding route content
  }

  // Load the route content for the given path
  async loadRoute(path, data = {}) {
    const route = this.routes[path]; // Get the route for the current path
    if (!route) {
      this.navigateTo("/"); // Redirect to home if route doesn't exist
      return;
    }

    if (this.currentRoute === path) return; // Avoid reloading the same route
    this.currentRoute = path;

    const template = document.getElementById(route.templateId);
    if (!template) {
      console.error(`Template ${route.templateId} not found`);
      return;
    }

    // Clear existing content before loading the new template
    const main = document.querySelector("main");
    main.innerHTML = ""; // Clear the content of the main element

    // Clone and insert the new content
    const content = template.content.cloneNode(true);
    main.appendChild(content);

    // Execute the callback if it exists
    if (route.callback && typeof route.callback === "function") {
      await route.callback(data);
    }

    // Update active navigation
    this.updateActiveNav(path);
  }

  // Update the active navigation link based on the current route
  updateActiveNav(path) {
    document.querySelectorAll("[data-page]").forEach((link) => {
      link.classList.remove("active");
      link.ariaCurrent = null;
    });

    const activeLink = document.querySelector(`[data-page="${path}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
      activeLink.ariaCurrent = "page";
    }
  }

  // Initialize the router by loading the initial route
  start() {
    const path = window.location.hash.slice(1) || "/"; // Use hash to get the route
    this.loadRoute(path); // Load the current route or default to home
  }
}
