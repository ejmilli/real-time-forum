// router.js - Updated for better route handling
export class Router {
  constructor() {
    this.routes = {};
    this.main = document.querySelector("main");
  }

  addRoute(path, templateId, callback) {
    this.routes[path] = { templateId, callback };
  }

  navigateTo(path) {
    // Handle both hash-based and direct navigation
    if (path.startsWith("#")) {
      window.location.hash = path;
    } else {
      window.location.hash = `#${path}`;
    }
  }

  // Enhanced route matching with parameters
  matchRoute(path) {
    // Try exact match first
    if (this.routes[path]) {
      return { route: this.routes[path], params: {} };
    }

    // Try parameter matching
    for (const routePath in this.routes) {
      const params = this.extractParams(routePath, path);
      if (params !== null) {
        return { route: this.routes[routePath], params };
      }
    }

    return null;
  }

  // Extract parameters from route like /posts/view/:id
  extractParams(routePath, actualPath) {
    const routeParts = routePath.split("/");
    const actualParts = actualPath.split("/");

    if (routeParts.length !== actualParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        // This is a parameter
        const paramName = routeParts[i].substring(1);
        params[paramName] = actualParts[i];
      } else if (routeParts[i] !== actualParts[i]) {
        // Parts don't match and it's not a parameter
        return null;
      }
    }

    return params;
  }

  async loadRoute() {
    let path = window.location.hash.substring(1) || "/";

    // Clean up path
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    if (path === "") {
      path = "/";
    }

    console.log("Loading route:", path);

    const match = this.matchRoute(path);

    if (match) {
      const { route, params } = match;

      // For posts routes, we don't use templates - the PostsManager handles rendering
      if (path.startsWith("posts")) {
        if (route.callback) {
          await route.callback(params);
        }
      } else {
        // For other routes, use templates
        const template = document.getElementById(route.templateId);
        if (template) {
          this.main.innerHTML = "";
          this.main.appendChild(document.importNode(template.content, true));
        }

        if (route.callback) {
          await route.callback(params);
        }
      }
    } else {
      console.warn(`No route found for ${path}`);
      // Fallback to home
      this.navigateTo("/");
    }
  }

  start() {
    window.addEventListener("hashchange", () => this.loadRoute());

    // Handle initial load
    if (!window.location.hash) {
      window.location.hash = "#/";
    } else {
      this.loadRoute();
    }
  }
}
