import type { User } from "./types";

const usersStorageKey = "postcore-users";
const sessionStorageKey = "postcore-current-user";
const adminStorageKey = "postcore-admin-id";

export function readUsers(): User[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(usersStorageKey);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

export function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
}

export function establishUserSession(user: User, users: User[]) {
  const savedAdminId = window.localStorage.getItem(adminStorageKey);
  const adminId =
    (savedAdminId && users.some((account) => account.id === savedAdminId)
      ? savedAdminId
      : users.find((account) => account.role === "admin")?.id) ?? user.id;
  const accounts = users.some((account) => account.id === user.id)
    ? users
    : [...users, user];
  const updatedUsers = accounts.map((account) => ({
    ...account,
    role: account.id === adminId ? ("admin" as const) : ("student" as const),
  }));
  const authenticatedUser = updatedUsers.find(
    (account) => account.id === user.id,
  )!;

  window.localStorage.setItem(adminStorageKey, adminId);
  writeUsers(updatedUsers);
  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify(authenticatedUser),
  );

  return { user: authenticatedUser, users: updatedUsers };
}

export function restoreUserSession() {
  if (typeof window === "undefined") return null;

  try {
    const rawSession = window.localStorage.getItem(sessionStorageKey);
    if (!rawSession) return null;

    const sessionUser = JSON.parse(rawSession) as User;
    const users = readUsers();
    const savedUser = users.find((account) => account.id === sessionUser.id);
    return establishUserSession(savedUser ?? sessionUser, users);
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}
