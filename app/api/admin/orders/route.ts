import { requireMarketingAdmin } from "@/lib/supabase/require-marketing-admin";

const orderIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const { client, response } = await requireMarketingAdmin();
  if (response || !client) {
    return (
      response ??
      Response.json({ message: "Order access could not be verified." }, { status: 500 })
    );
  }

  const { data, error } = await client
    .from("orders")
    .select(
      "id, order_reference, product_name, price, quantity, seller_email, delivery_address, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to retrieve purchase requests:", error.message);
    return Response.json(
      { message: "Orders could not be loaded." },
      { status: 500 },
    );
  }

  return Response.json({ orders: data });
}

export async function PATCH(request: Request) {
  const { client, response } = await requireMarketingAdmin();
  if (response || !client) {
    return (
      response ??
      Response.json({ message: "Order access could not be verified." }, { status: 500 })
    );
  }

  let body: { id?: unknown; status?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; status?: unknown };
  } catch {
    return Response.json(
      { message: "The update request must contain valid JSON." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return Response.json(
      { message: "The update request must be a JSON object." },
      { status: 400 },
    );
  }

  if (
    typeof body.id !== "string" ||
    !orderIdPattern.test(body.id) ||
    (body.status !== "new" && body.status !== "completed")
  ) {
    return Response.json(
      { message: "A valid order and status are required." },
      { status: 400 },
    );
  }

  const { data, error } = await client
    .from("orders")
    .update({ status: body.status })
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to update purchase request:", error.message);
    return Response.json(
      { message: "The order status could not be updated." },
      { status: 500 },
    );
  }
  if (!data) {
    return Response.json({ message: "Order not found." }, { status: 404 });
  }

  return Response.json({ updated: true });
}

export async function DELETE(request: Request) {
  const { client, response } = await requireMarketingAdmin();
  if (response || !client) {
    return (
      response ??
      Response.json({ message: "Order access could not be verified." }, { status: 500 })
    );
  }

  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return Response.json(
      { message: "The delete request must contain valid JSON." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return Response.json(
      { message: "The delete request must be a JSON object." },
      { status: 400 },
    );
  }

  if (typeof body.id !== "string" || !orderIdPattern.test(body.id)) {
    return Response.json(
      { message: "A valid order ID is required." },
      { status: 400 },
    );
  }

  const { data, error } = await client
    .from("orders")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete purchase request:", error.message);
    return Response.json(
      { message: "The order could not be deleted." },
      { status: 500 },
    );
  }
  if (!data) {
    return Response.json({ message: "Order not found." }, { status: 404 });
  }

  return Response.json({ deleted: true });
}
