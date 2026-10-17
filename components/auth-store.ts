import type { DeliveryAddress, User } from "./types";

const usersStorageKey = "postcore-users";

function isDeliveryAddress(value: unknown): value is DeliveryAddress {
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

function sanitizeStoredUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.email !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: "student",
    ...(typeof record.image === "string" ? { image: record.image } : {}),
    ...(isDeliveryAddress(record.deliveryAddress)
      ? { deliveryAddress: record.deliveryAddress }
      : {}),
  };
}

function userProfileForStorage(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.image ? { image: user.image } : {}),
    ...(user.deliveryAddress ? { deliveryAddress: user.deliveryAddress } : {}),
  };
}

export function readUsers(): User[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(usersStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const users = parsed
      .map(sanitizeStoredUser)
      .filter((user): user is User => user !== null);
    writeUsers(users);
    return users;
  } catch {
    return [];
  }
}

export function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    usersStorageKey,
    JSON.stringify(users.map(userProfileForStorage)),
  );
}
