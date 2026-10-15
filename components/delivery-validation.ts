type DeliveryDestination = {
  recipient?: unknown;
  classNumber?: unknown;
  roomNumber?: unknown;
  building?: unknown;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const validFloors = new Set([
  "1",
  "2",
  "3",
  "4",
]);

export function isValidFloor(value: unknown): value is string {
  return typeof value === "string" && validFloors.has(value.trim().toLowerCase());
}

export function isValidClassNumber(value: unknown): value is string {
  return typeof value === "string" && /^(?:[1-9]|1[0-2])[A-D]$/i.test(value.trim());
}

export function getDeliveryAddressError(
  address: DeliveryDestination,
): string | null {
  if (!hasText(address.recipient)) {
    return "Enter the recipient's name.";
  }

  if (!isValidClassNumber(address.classNumber)) {
    return "Enter a class from 1A to 12D, using a number from 1 to 12 and a letter from A to D.";
  }

  if (hasText(address.building) && !isValidFloor(address.building)) {
    return "Enter a floor number from 1 to 4.";
  }

  if (!hasText(address.roomNumber) && !hasText(address.building)) {
    return "Enter a room number or a building/floor.";
  }

  return null;
}
