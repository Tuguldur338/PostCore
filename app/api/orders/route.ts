import { createClient } from "@supabase/supabase-js";
import { getDeliveryAddressError } from "@/components/delivery-validation";
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

  const client = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const orderReference = crypto.randomUUID().toUpperCase();
  const { data, error } = await client.rpc("place_order", {
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
  });

  if (error) {
    if (error.message.includes("PRODUCT_NOT_FOUND")) {
      return Response.json(
        { message: "This product is no longer available." },
        { status: 404 },
      );
    }
    if (error.message.includes("INSUFFICIENT_STOCK")) {
      return Response.json(
        { message: "There is not enough stock for that quantity. Refresh the catalog and try again." },
        { status: 409 },
      );
    }
    if (error.message.includes("PRODUCT_UNAVAILABLE")) {
      return Response.json(
        { message: "This product is currently unavailable." },
        { status: 409 },
      );
    }
    console.error("Failed to save purchase request:", error.message);
    return Response.json(
      { message: "The order could not be saved. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({
    orderReference: typeof data === "string" ? data : orderReference,
  });
}
