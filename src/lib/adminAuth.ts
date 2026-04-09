const ADMIN_PASSWORD_KEY = 'dthc_admin_password';
const ADMIN_SESSION_KEY = 'dthc_admin_session';
const DEFAULT_ADMIN_PASSWORD = 'T4N4AMEG8F5';
export const ADMIN_RESET_PASSWORD = 'DTHC@T4N4AMEG8F5';

export function getStoredAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminPassword(password: string) {
  return password === getStoredAdminPassword();
}

export function unlockAdminSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, 'open');
  window.dispatchEvent(new Event('admin-session-changed'));
}

export function lockAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event('admin-session-changed'));
}

export function isAdminSessionOpen() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'open';
}

export function resetAdminPassword(nextPassword: string) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, nextPassword);
  window.dispatchEvent(new Event('admin-password-changed'));
}

export function isStrongAdminPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
