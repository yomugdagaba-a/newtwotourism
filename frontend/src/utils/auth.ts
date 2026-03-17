// frontend/src/utils/auth.ts

import { AuthResponseDto } from "../types/auth";

// Get token from localStorage
export function getToken(): string | null {
  return localStorage.getItem("token");
}

// Save token to localStorage
export function saveToken(token: string): void {
  localStorage.setItem("token", token);
}

// Remove token
export function removeToken(): void {
  localStorage.removeItem("token");
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Optional helper to get Authorization header
export function authHeader(): { Authorization?: string } {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
