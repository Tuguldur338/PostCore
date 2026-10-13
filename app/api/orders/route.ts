import { getDeliveryAddressError } from "@/components/delivery-validation";

type PurchaseRequest = {
  orderReference?: unknown;
  productName?: unknown;
  price?: unknown;
  sellerEmail?: unknown;
  placedAt?: unknown;
  deliveryAddress?: {
    recipient?: unknown;
    classNumber?: unknown;
    roomNumber?: unknown;
    building?: unknown;
    instructions?: unknown;
  };
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let order: PurchaseRequest;
  try {
    order = (await request.json()) as PurchaseRequest;
  } catch {
    return Response.json(
      { message: "The purchase request must contain valid JSON.", sent: false },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(order.orderReference) ||
    !isNonEmptyString(order.productName) ||
    !isNonEmptyString(order.price) ||
    !isNonEmptyString(order.placedAt) ||
    !order.deliveryAddress
  ) {
    return Response.json(
      { message: "The purchase request is missing required details.", sent: false },
      { status: 400 },
    );
  }

  const addressError = getDeliveryAddressError(order.deliveryAddress);
  if (addressError) {
    return Response.json({ message: addressError, sent: false }, { status: 400 });
  }

  const recipient = isNonEmptyString(order.sellerEmail)
    ? order.sellerEmail.trim()
    : process.env.SELLER_NOTIFICATION_EMAIL?.trim();
  if (!recipient || !isValidEmail(recipient)) {
    return Response.json(
      { message: "This listing does not have valid seller contact details.", sent: false },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !adminEmail) {
    return Response.json(
      { message: "The server email service is not configured.", sent: false },
      { status: 503 },
    );
  }

  const address = order.deliveryAddress;
  const text = [
    `Purchase request: ${order.productName.trim()}`,
    `Price: ${order.price.trim()}`,
    `Order reference: ${order.orderReference.trim()}`,
    `Placed at: ${order.placedAt.trim()}`,
    "",
    "Deliver to:",
    `Student: ${String(address.recipient).trim()}`,
    `Class: ${String(address.classNumber).trim()}`,
    isNonEmptyString(address.roomNumber) && `Room: ${address.roomNumber.trim()}`,
    isNonEmptyString(address.building) && `Floor: ${address.building.trim()}`,
    isNonEmptyString(address.instructions) &&
      `Instructions: ${address.instructions.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient, adminEmail],
        subject: `Purchase request: ${order.productName.trim()}`,
        text,
      }),
    });
  } catch {
    return Response.json(
      { message: "The server could not reach the email service.", sent: false },
      { status: 502 },
    );
  }

  if (!resendResponse.ok) {
    return Response.json(
      { message: "The email service could not send the purchase request.", sent: false },
      { status: 502 },
    );
  }

  return Response.json({ sent: true });
}
