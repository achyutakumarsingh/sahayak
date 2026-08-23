/**
 * Base URL of the Sahayak backend.
 *
 * NEXT_PUBLIC_API_BASE_URL is inlined at build time. When it is missing we fall
 * back to same-origin in the browser rather than to localhost: on a deployed
 * host, localhost:8000 is the visitor's own machine, so every request would
 * fail in a way that looks like the backend is down. Same-origin at least works
 * behind a proxy or rewrite, and localhost is kept only for server-side calls
 * during local development.
 */
const CONFIGURED = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const FALLBACK =
  typeof window === "undefined" ? "http://localhost:8000" : window.location.origin;

/** Builds an absolute URL to a backend endpoint, e.g. apiUrl("/api/health"). */
export function apiUrl(path: string): string {
  const base = CONFIGURED ?? FALLBACK;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
