// auth.js - Updated for session management
export async function isAuthenticated() {
  try {
    const response = await fetch("/api/check-auth", {
      method: "GET",
      credentials: "include", // Important: include cookies
    });
    return response.ok;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}

export async function logout() {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include", // Important: include cookies
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// Get current user session info (if needed)
export async function getCurrentUser() {
  try {
    const response = await fetch("/api/user", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
