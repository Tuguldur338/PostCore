import { requireMarketingAdmin } from "@/lib/supabase/require-marketing-admin";
import { maxProductImageDataUrlLength } from "@/components/product-image";
import type { Product } from "@/components/types";

type ProductInput = {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  badge?: unknown;
  description?: unknown;
  image?: unknown;
  category?: unknown;
  fitsFor?: unknown;
  pickupClass?: unknown;
  pickupRoom?: unknown;
  pickupMethod?: unknown;
  quantity?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function toProduct(row: {
  id: string;
  name: string;
  price: string;
  badge: string;
  description: string;
  image: string;
  category: string;
  fits_for: string;
  pickup_class: string;
  pickup_room: string;
  pickup_method: string;
  quantity: number | null;
  is_available: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    badge: row.badge,
    description: row.description,
    image: row.image,
    category: row.category,
    fitsFor: row.fits_for,
    pickupClass: row.pickup_class,
    pickupRoom: row.pickup_room,
    pickupMethod: row.pickup_method,
    quantity: row.quantity ?? undefined,
    outOfStock: !row.is_available,
  };
}

export async function GET() {
  const { client, response } = await requireMarketingAdmin();
  if (response || !client) {
    return response ?? Response.json({ message: "Admin access could not be verified." }, { status: 500 });
  }

  return Response.json({ authorized: true });
}

export async function POST(request: Request) {
  const { client, response, user } = await requireMarketingAdmin();
  if (response || !client) {
    return response ?? Response.json({ message: "Admin access could not be verified." }, { status: 500 });
  }

  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return Response.json({ message: "The product request must contain valid JSON." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    (body.id !== undefined && (typeof body.id !== "string" || !uuidPattern.test(body.id))) ||
    !isText(body.name, 200) ||
    typeof body.price !== "string" ||
    !/^[1-9]\d{0,11}$/.test(body.price) ||
    !isText(body.badge, 80) ||
    !isText(body.description, 2000) ||
    !isText(body.image, maxProductImageDataUrlLength) ||
    !isText(body.category, 80) ||
    !isText(body.fitsFor, 200) ||
    (body.pickupClass !== undefined &&
      (typeof body.pickupClass !== "string" ||
        body.pickupClass.length > 20 ||
        (body.pickupClass.trim() !== "" &&
          !/^(?:[1-9]|1[0-2])[A-D]$/i.test(body.pickupClass.trim())))) ||
    (body.pickupRoom !== undefined &&
      (typeof body.pickupRoom !== "string" || body.pickupRoom.length > 100)) ||
    (body.pickupMethod !== undefined &&
      (typeof body.pickupMethod !== "string" ||
        body.pickupMethod.length > 160)) ||
    typeof body.quantity !== "number" ||
    !Number.isSafeInteger(body.quantity) ||
    body.quantity < 1 ||
    body.quantity > 2_147_483_647
  ) {
    return Response.json({ message: "The product details are invalid." }, { status: 400 });
  }

  const row = {
    id: body.id ?? crypto.randomUUID(),
    name: body.name.trim(),
    price: body.price,
    badge: body.badge.trim(),
    description: body.description.trim(),
    image: body.image,
    category: body.category.trim(),
    fits_for: body.fitsFor.trim(),
    pickup_class:
      typeof body.pickupClass === "string" ? body.pickupClass.trim() : "",
    pickup_room:
      typeof body.pickupRoom === "string" ? body.pickupRoom.trim() : "",
    pickup_method:
      typeof body.pickupMethod === "string" ? body.pickupMethod.trim() : "",
    seller_email: user.email?.trim().toLowerCase() ?? null,
    quantity: body.quantity,
    is_available: true,
  };
  const { data, error } = await client
    .from("products")
    .upsert(row, { onConflict: "id", ignoreDuplicates: true })
    .select(
      "id, name, price, badge, description, image, category, fits_for, pickup_class, pickup_room, pickup_method, quantity, is_available",
    )
    .maybeSingle();

  if (error) {
    console.error("Failed to create product:", error.message);
    if (error.code === "42703") {
      return Response.json(
        {
          message:
            "Supabase is missing the seller pickup-detail fields. Run the latest supabase/schema.sql in your Supabase SQL Editor, then try again.",
        },
        { status: 503 },
      );
    }
    if (
      error.code === "23514" &&
      error.message.includes("products_image_check")
    ) {
      return Response.json(
        {
          message:
            "Supabase is still using the old product photo-size limit. Run the latest supabase/schema.sql in your Supabase SQL Editor, then try adding the product again.",
        },
        { status: 503 },
      );
    }
    return Response.json({ message: "The product could not be saved." }, { status: 500 });
  }

  return Response.json({ product: data ? toProduct(data) : null });
}

export async function PATCH(request: Request) {
  const { client, response } = await requireMarketingAdmin();
  if (response || !client) {
    return response ?? Response.json({ message: "Admin access could not be verified." }, { status: 500 });
  }

  let body: { id?: unknown; quantity?: unknown; outOfStock?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ message: "The inventory update must contain valid JSON." }, { status: 400 });
  }

  if (
    !body ||
    typeof body.id !== "string" ||
    body.id.length > 36 ||
    (body.quantity === undefined) === (body.outOfStock === undefined) ||
    (body.quantity !== undefined &&
      (typeof body.quantity !== "number" ||
        !Number.isSafeInteger(body.quantity) ||
        body.quantity < 0 ||
        body.quantity > 2_147_483_647)) ||
    (body.outOfStock !== undefined && typeof body.outOfStock !== "boolean")
  ) {
    return Response.json({ message: "The inventory update is invalid." }, { status: 400 });
  }

  const update =
    typeof body.quantity === "number"
      ? { quantity: body.quantity, is_available: body.quantity > 0 }
      : { is_available: body.outOfStock === false };
  const { data, error } = await client
    .from("products")
    .update(update)
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to update product inventory:", error.message);
    return Response.json({ message: "The inventory could not be updated." }, { status: 500 });
  }
  if (!data) {
    return Response.json({ message: "Product not found." }, { status: 404 });
  }

  return Response.json({ updated: true });
}

export async function DELETE(request: Request) {
  const { client, response } = await requireMarketingAdmin();
  if (response || !client) {
    return response ?? Response.json({ message: "Admin access could not be verified." }, { status: 500 });
  }

  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return Response.json({ message: "The delete request must contain valid JSON." }, { status: 400 });
  }

  if (!body || typeof body.id !== "string" || body.id.length > 36) {
    return Response.json({ message: "A valid product ID is required." }, { status: 400 });
  }

  const { data, error } = await client
    .from("products")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Failed to delete product:", error.message);
    return Response.json({ message: "The product could not be removed." }, { status: 500 });
  }
  if (!data) {
    return Response.json({ message: "Product not found." }, { status: 404 });
  }

  return Response.json({ deleted: true });
}
