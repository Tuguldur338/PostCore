import nodemailer from "nodemailer";

type DeliveryAddress = {
  recipient: string;
  street: string;
  apartment: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  instructions: string;
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
    isNonEmptyString(address?.street) &&
    isNonEmptyString(address?.city) &&
    isNonEmptyString(address?.region) &&
    isNonEmptyString(address?.postalCode) &&
    isNonEmptyString(address?.country)
  );
}

export async function POST(request: Request) {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!gmailUser || !gmailAppPassword) {
    return Response.json(
      { message: "Gmail sending is not configured on the server." },
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
  if (!sellerNotificationEmail) {
    return Response.json(
      { message: "This listing does not have a seller email address." },
      { status: 400 },
    );
  }

  const address = payload.deliveryAddress;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: { name: "CaseCart Orders", address: gmailUser },
      to: sellerNotificationEmail,
      subject: `New CaseCart order ${payload.orderReference}`,
      text: [
        "A new order was placed on CaseCart.",
        "",
        `Order reference: ${payload.orderReference}`,
        `Product: ${payload.productName}`,
        `Price: ${payload.price}`,
        `Placed at: ${payload.placedAt}`,
        "",
        "Delivery address:",
        address.recipient,
        address.street,
        address.apartment,
        `${address.city}, ${address.region} ${address.postalCode}`,
        address.country,
        address.instructions ? `Instructions: ${address.instructions}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch {
    return Response.json(
      {
        message:
          "Gmail could not send the seller alert. Check the server settings.",
      },
      { status: 502 },
    );
  }

  return Response.json({ sent: true });
}
