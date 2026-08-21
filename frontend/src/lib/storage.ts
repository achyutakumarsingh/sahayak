/**
 * Storage keys shared between the client providers and the render-blocking
 * inline script in the layout.
 *
 * These deliberately live outside providers.tsx. That file is a "use client"
 * module, and when a server component imports a plain constant from one, Next
 * hands back a client-reference proxy rather than the value — the inline
 * script ended up calling localStorage.getItem(undefined).
 */
export const PREFERENCES_KEY = "sahayak.preferences";
export const SESSION_KEY = "sahayak.session";
