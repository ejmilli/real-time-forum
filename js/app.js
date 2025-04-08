import { Router } from "./router.js"; // Make sure the path to the router is correct

const router = new Router();

// Define the routes and their associated templates
router.addRoute("/", "homeTemplate");
router.addRoute("/posts", "postTemplate");
router.addRoute("/chat", "chatTemplate");
router.addRoute("/signup", "signupTemplate");
router.addRoute("/login", "loginTemplate");

// Start the router
router.start();
