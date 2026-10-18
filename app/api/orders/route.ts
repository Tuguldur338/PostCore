import { getDeliveryAddressError } from "@/components/delivery-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseConfig,
  supabaseSetupMessage,
} from "@/lib/supabase/config";

type PurchaseRequest = {
  productId?: unknown;
  quantity?: unknown;
  deliveryAddress?: unknown;
};

type DeliveryAddress = {
  recipient: string;
  classNumber: string;
  roomNumber: string;
  building: string;
  instructions: string;
};

type SavedOrderReceipt = {
  orderReference?: unknown;
  purchasedAt?: unknown;
};

const orderReferenceAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const orderReferenceLength = 6;
const maxOrderReferenceAttempts = 5;

function createOrderReference(): string {
  const randomBytes = crypto.getRandomValues(
    new Uint8Array(orderReferenceLength),
  );
  return Array.from(
    randomBytes,
    (byte) => orderReferenceAlphabet[byte % orderReferenceAlphabet.length],
  ).join("");
}

function isOrderReferenceCollision(error: {
  code: string;
  message: string;
  details: string | null;
}): boolean {
  return (
    error.code === "23505" &&
    /orders_order_reference_key|order_reference/i.test(
      `${error.message} ${error.details ?? ""}`,
    )
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDeliveryAddress(value: unknown): value is DeliveryAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const address = value as Record<string, unknown>;
  return (
    typeof address.recipient === "string" &&
    address.recipient.trim().length <= 200 &&
    typeof address.classNumber === "string" &&
    address.classNumber.length <= 20 &&
    typeof address.roomNumber === "string" &&
    address.roomNumber.length <= 100 &&
    typeof address.building === "string" &&
    address.building.length <= 20 &&
    typeof address.instructions === "string" &&
    address.instructions.length <= 1000
  );
}

export async function GET() {
  if (!getSupabaseConfig()) {
    return Response.json({ message: supabaseSetupMessage }, { status: 503 });
  }

  const client = await createSupabaseServerClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) {
    return Response.json(
      { message: "Sign in to view your purchase receipts." },
      { status: 401 },
    );
  }

  const { data: receipts, error } = await client
    .from("orders")
    .select(
      "id, order_reference, product_name, price, quantity, seller_email, delivery_address, status, created_at",
    )
    .eq("buyer_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to retrieve purchase receipts:", error.message);
    if (
      error.code === "PGRST205" ||
      error.code === "PGRST204" ||
      error.code === "42P01" ||
      error.code === "42703"
    ) {
      return Response.json(
        {
          message:
            "Purchase history is not set up yet. Run the latest supabase/schema.sql in your Supabase project's SQL Editor.",
        },
        { status: 503 },
      );
    }
    return Response.json(
      { message: "Your purchase receipts could not be loaded." },
      { status: 500 },
    );
  }

  return Response.json({ receipts });
}

export async function POST(request: Request) {
  const config = getSupabaseConfig();
  if (!config) {
    return Response.json(
      { message: supabaseSetupMessage },
      { status: 503 },
    );
  }

  let order: PurchaseRequest;
  try {
    order = (await request.json()) as PurchaseRequest;
  } catch {
    return Response.json(
      { message: "The order request must contain valid JSON." },
      { status: 400 },
    );
  }

  if (!order || typeof order !== "object") {
    return Response.json(
      { message: "The order request must be a JSON object." },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(order.productId) ||
    order.productId.trim().length > 36 ||
    typeof order.quantity !== "number" ||
    !Number.isSafeInteger(order.quantity) ||
    order.quantity < 1 ||
    order.quantity > 2_147_483_647 ||
    !isDeliveryAddress(order.deliveryAddress)
  ) {
    return Response.json(
      { message: "The order request is missing valid product or delivery details." },
      { status: 400 },
    );
  }

  const addressError = getDeliveryAddressError(order.deliveryAddress);
  if (addressError) {
    return Response.json({ message: addressError }, { status: 400 });
  }

  const client = await createSupabaseServerClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) {
    if (authError?.name !== "AuthSessionMissingError") {
      console.error(
        "Could not verify buyer session:",
        authError?.message ?? "No authenticated buyer.",
      );
    }
    return Response.json(
      { message: "Sign in before placing an order so it appears in your receipts." },
      { status: 401 },
    );
  }
  let data: unknown = null;
  let error: {
    code: string;
    message: string;
    details: string | null;
  } | null = null;
  let attempts = 0;

  while (attempts < maxOrderReferenceAttempts) {
    attempts += 1;
    const orderReference = createOrderReference();
    const result = await client.rpc("place_order", {
      p_product_id: order.productId.trim(),
      p_quantity: order.quantity,
      p_delivery_address: {
        recipient: order.deliveryAddress.recipient.trim(),
        classNumber: order.deliveryAddress.classNumber.trim(),
        roomNumber: order.deliveryAddress.roomNumber.trim(),
        building: order.deliveryAddress.building.trim(),
        instructions: order.deliveryAddress.instructions.trim(),
      },
      p_order_reference: orderReference,
      p_buyer_id: auth.user.id,
    });
    data = result.data;
    error = result.error;

    if (!error || !isOrderReferenceCollision(error)) break;
  }

  if (error) {
    if (isOrderReferenceCollision(error)) {
      console.error(
        "Could not generate a unique order reference after several attempts.",
      );
      return Response.json(
        { message: "A unique order code could not be generated. Please retry." },
        { status: 503 },
      );
    }
    if (error.code === "PGRST202" || error.code === "42883") {
      return Response.json(
        {
          message:
            "Order storage is not up to date. Run the latest supabase/schema.sql in your Supabase project's SQL Editor.",
        },
        { status: 503 },
      );
    }
    if (error.message.includes("PRODUCT_NOT_FOUND")) {
      return Response.json(
        { message: "This product is no longer available." },
        { status: 404 },
      );
    }
    if (error.message.includes("INSUFFICIENT_STOCK")) {
      return Response.json(
        {
          code: "INSUFFICIENT_STOCK",
          message:
            "The stock changed while you were checking out. That quantity is no longer available; refresh the catalog and choose a smaller amount.",
        },
        { status: 409 },
      );
    }
    if (error.message.includes("PRODUCT_UNAVAILABLE")) {
      return Response.json(
        {
          code: "PRODUCT_UNAVAILABLE",
          message: "This item has sold out and is no longer available.",
        },
        { status: 409 },
      );
    }
    if (error.message.includes("INVALID_BUYER")) {
      return Response.json(
        { message: "Your account session changed. Sign in again and retry." },
        { status: 401 },
      );
    }
    console.error("Failed to save purchase request:", error.message);
    return Response.json(
      { message: "The order could not be saved. Please try again." },
      { status: 500 },
    );
  }

  const receipt =
    data && typeof data === "object"
      ? (data as SavedOrderReceipt)
      : null;
  if (
    !receipt ||
    typeof receipt.orderReference !== "string" ||
    typeof receipt.purchasedAt !== "string"
  ) {
    console.error("The purchase function returned an invalid receipt.");
    return Response.json(
      { message: "The order was saved, but its receipt could not be prepared." },
      { status: 500 },
    );
  }

  return Response.json({
    orderReference: receipt.orderReference,
    purchasedAt: receipt.purchasedAt,
  });
}
