import { jwtDecode } from "jwt-decode";

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return getToken() !== null;
}

export function getUserRole() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    return (
      decoded.role ||
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      null
    );
  } catch {
    return null;
  }
}

export function isModerator() {
  return getUserRole() === "Moderator";
}