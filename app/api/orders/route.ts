import { formatMntPrice } from "@/components/currency";

type DeliveryAddress = {
  recipient: string;
  classNumber: string;
  roomNumber: string;
  building?: string;
  instructions?: string;
};

type OrderNotification = {
  orderReference: string;
  productName: string;
  price: string;
  sellerEmail?: string;
  placedAt: string;
  deliveryAddress: DeliveryAddress;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isOrderNotification(value: unknown): value is OrderNotification {
  if (!value || typeof value !== "object") return false;

  const order = value as Partial<OrderNotification>;
  const address = order.deliveryAddress;

  return (
    isNonEmptyString(order.orderReference) &&
    /^[A-Z0-9-]{1,24}$/.test(order.orderReference) &&
    isNonEmptyString(order.productName) &&
    order.productName.length <= 160 &&
    isNonEmptyString(order.price) &&
    order.price.length <= 40 &&
    (order.sellerEmail === undefined ||
      (isNonEmptyString(order.sellerEmail) &&
        isEmailAddress(order.sellerEmail))) &&
    isNonEmptyString(order.placedAt) &&
    Boolean(address) &&
    isNonEmptyString(address?.recipient) &&
    isNonEmptyString(address?.classNumber) &&
    isNonEmptyString(address?.roomNumber)
  );
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!resendApiKey || !fromEmail) {
    return Response.json(
      {
        message:
          "Email sending is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL on the server.",
      },
      { status: 503 },
    );
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!isOrderNotification(payload)) {
    return Response.json(
      { message: "The order details are incomplete." },
      { status: 400 },
    );
  }

  const sellerNotificationEmail =
    payload.sellerEmail?.trim() ||
    process.env.SELLER_NOTIFICATION_EMAIL?.trim();
  if (!sellerNotificationEmail || !isEmailAddress(sellerNotificationEmail)) {
    return Response.json(
      { message: "This listing does not have a seller email address." },
      { status: 400 },
    );
  }

  const address = payload.deliveryAddress;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": payload.orderReference,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [sellerNotificationEmail],
        subject: `New PostCore order ${payload.orderReference}`,
        text: [
          "A new order was placed on PostCore.",
          "",
          `Order reference: ${payload.orderReference}`,
          `Product: ${payload.productName}`,
          `Price: ${formatMntPrice(payload.price)}`,
          `Placed at: ${payload.placedAt}`,
          "",
          "Deliver to:",
          `Student: ${address.recipient}`,
          `Class: ${address.classNumber}`,
          `Room: ${address.roomNumber}`,
          address.building ? `Building / floor: ${address.building}` : "",
          address.instructions ? `Instructions: ${address.instructions}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });

    if (!response.ok) {
      const providerResponse: unknown = await response.json().catch(() => null);
      const providerMessage =
        providerResponse &&
        typeof providerResponse === "object" &&
        "message" in providerResponse &&
        typeof providerResponse.message === "string"
          ? providerResponse.message.trim().slice(0, 300)
          : "";

      if (/api key is invalid/i.test(providerMessage)) {
        return Response.json(
          {
            message:
              "Resend says the RESEND_API_KEY is invalid. Create a new API key in the Resend dashboard, paste it into the RESEND_API_KEY environment variable in Netlify, and redeploy.",
          },
          { status: 502 },
        );
      }

      return Response.json(
        {
          message: providerMessage
            ? `Resend rejected the email: ${providerMessage}`
            : "Resend rejected the email. Check your API key, sender verification, and recipient restrictions.",
        },
        { status: 502 },
      );
    }
  } catch {
    return Response.json(
      {
        message: "The email provider could not be reached. Please try again.",
      },
      { status: 502 },
    );
  }

  return Response.json({ sent: true });
}
