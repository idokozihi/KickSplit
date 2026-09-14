// Vite supplies the backend origin at build time; Node tests have no import.meta.env.
export function apiUrl(path, baseUrl = import.meta.env?.VITE_API_BASE_URL) {
  const origin = (baseUrl || "").trim().replace(/\/+$/, "");
  return `${origin}/api${path}`;
}
