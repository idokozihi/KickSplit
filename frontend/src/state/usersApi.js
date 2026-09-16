import { apiUrl } from "./apiBase.js";

export async function saveUserProfile(user, updates) {
  if (!Number.isInteger(user?.id)) throw new Error("Please log in to update your profile.");
  let response;
  try {
    response = await fetch(apiUrl(`/users/${user.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: updates.name ?? user.name,
        username: updates.username ?? user.username,
        email: updates.email ?? user.email,
        imageUrl: (updates.photo ?? user.photo) || null,
      }),
    });
  } catch {
    throw new Error("Could not connect to KickSplit. Please try saving again.");
  }
  if (!response.ok) {
    let message;
    try {
      const details = await response.json();
      message = details.message;
    } catch { /* The server may not provide an error body. */ }
    throw new Error(message || "Could not save your profile. Please try again.");
  }
  const saved = await response.json();
  if (!Number.isInteger(saved?.id) || !saved.email) {
    throw new Error("The server returned an invalid profile. Please try again.");
  }
  return { id: saved.id, name: saved.name, username: saved.username, email: saved.email, photo: saved.imageUrl || "" };
}
