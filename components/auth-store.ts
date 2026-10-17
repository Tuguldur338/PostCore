import type { User } from "./types";

const usersStorageKey = "postcore-users";

function isDeliveryAddress(
  value: unknown,
): value is NonNullable<User["deliveryAddress"]> {
  if (!value || typeof value !== "object") return false;
  const address = value as Record<string, unknown>;
  return (
    typeof address.recipient === "string" &&
    typeof address.classNumber === "string" &&
    typeof address.roomNumber === "string" &&
    typeof address.building === "string" &&
    typeof address.instructions === "string"
  );
}

function sanitizeUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;
  const saved = value as Record<string, unknown>;
  if (
    typeof saved.id !== "string" ||
    typeof saved.name !== "string" ||
    typeof saved.email !== "string"
  ) {
    return null;
  }

  return {
    id: saved.id,
    name: saved.name,
    email: saved.email,
    role: saved.role === "admin" ? "admin" : "student",
    ...(typeof saved.image === "string" ? { image: saved.image } : {}),
    ...(isDeliveryAddress(saved.deliveryAddress)
      ? { deliveryAddress: saved.deliveryAddress }
      : {}),
  };
}

export function readUsers(): User[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(usersStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const users = parsed
      .map(sanitizeUser)
      .filter((user): user is User => user !== null);
    writeUsers(users);
    return users;
  } catch {
    return [];
  }
}

export function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  const profileOnlyUsers = users.map(({ id, name, email, role, image, deliveryAddress }) => ({
    id,
    name,
    email,
    role,
    ...(image ? { image } : {}),
    ...(deliveryAddress ? { deliveryAddress } : {}),
  }));
  window.localStorage.setItem(usersStorageKey, JSON.stringify(profileOnlyUsers));
}
