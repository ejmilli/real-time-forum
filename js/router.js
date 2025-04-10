export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;

    // Bind methods to ensure correct 'this' context
    this.handlePopState = this.handlePopState.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener("popstate", this.handlePopState);
    document.addEventListener("click", this.handleClick);
  }

  handlePopState() {
    const path = window.location.hash.slice(1) || "signup";
    this.loadRoute(path);
  }

  handleClick(e) {
    const link = e.target.closest("a[href^='#']");
    if (link) {
      e.preventDefault();
      const path = link.getAttribute("href").slice(1);
      this.navigateTo(path);
    }
  }

  addRoute(path, templateId, callback) {
    this.routes[path] = { templateId, callback };
  }

  navigateTo(path, data = {}) {
    window.history.pushState({}, "", `#${path}`);
    this.loadRoute(path, data);
  }

  async loadRoute(path, data = {}) {
    const route = this.routes[path];
    if (!route) {
      this.navigateTo("signup"); // Default to signup
      return;
    }

    if (this.currentRoute === path) return;
    this.currentRoute = path;

    const template = document.getElementById(route.templateId);
    if (!template) {
      console.error(`Template ${route.templateId} not found`);
      return;
    }

    const main = document.querySelector("main");
    main.innerHTML = "";
    const content = template.content.cloneNode(true);
    main.appendChild(content);

    if (route.callback && typeof route.callback === "function") {
      await route.callback(data);
    }

    this.updateActiveNav();
  }

  updateActiveNav() {
    const currentHash = window.location.hash;

    document.querySelectorAll("nav a").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === currentHash) {
        link.classList.add("active");
      }
    });
  }

  start() {
    const path = window.location.hash.slice(1) || "signup";
    this.loadRoute(path);
  }

  // Clean up event listeners when router is destroyed
  destroy() {
    window.removeEventListener("popstate", this.handlePopState);
    document.removeEventListener("click", this.handleClick);
  }
}
