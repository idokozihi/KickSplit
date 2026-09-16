import { apiUrl } from "./apiBase.js";

async function authenticate(path, body) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not connect to KickSplit. Please try again.");
  }
  if (!response.ok) {
    let message;
    try {
      const details = await response.json();
      message = details.message || details.error;
    } catch { /* The server may return an empty error response. */ }
    throw new Error(message || (path === "/auth/login"
      ? "Login failed. Check your email and password."
      : "Sign up failed. Check your details and try again."));
  }
  const user = await response.json();
  if (!Number.isInteger(user?.id) || !user.email) {
    throw new Error("The server returned an invalid user. Please try again.");
  }
  return { id: user.id, name: user.name, username: user.username, email: user.email, photo: user.imageUrl || "" };
}

export const loginUser = (email, password) => authenticate("/auth/login", { email, password });
export const registerUser = (name, email, password) => authenticate("/auth/register", { name, email, password });
