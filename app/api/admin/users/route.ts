import { requireMarketingAdmin } from "@/lib/supabase/require-marketing-admin";

const userIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const marketplaceRoles = ["student", "marketplace_admin", "admin"] as const;
type MarketplaceRole = (typeof marketplaceRoles)[number];

function isMarketplaceRole(value: unknown): value is MarketplaceRole {
  return (
    typeof value === "string" &&
    marketplaceRoles.some((role) => role === value)
  );
}

export async function GET() {
  const { client, response, role } = await requireMarketingAdmin();
  if (response || !client) {
    return response ?? Response.json({ message: "Admin access could not be verified." }, { status: 500 });
  }
  if (!role) {
    return Response.json(
      { message: "Marketplace admin access could not be verified." },
      { status: 403 },
    );
  }

  const { data, error } = await client
    .from("marketplace_profiles")
    .select("user_id, email, display_name, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load marketplace accounts:", error.message);
    return Response.json(
      { message: "Marketplace accounts could not be loaded." },
      { status: 500 },
    );
  }

  return Response.json({ users: data });
}

export async function PATCH(request: Request) {
  const { client, response, role, user } = await requireMarketingAdmin();
  if (response || !client || !user) {
    return response ?? Response.json({ message: "Admin access could not be verified." }, { status: 500 });
  }
  if (!role) {
    return Response.json(
      { message: "Marketplace admin access could not be verified." },
      { status: 403 },
    );
  }

  let body: { userId?: unknown; role?: unknown };
  try {
    body = (await request.json()) as { userId?: unknown; role?: unknown };
  } catch {
    return Response.json(
      { message: "The role update must contain valid JSON." },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.userId !== "string" ||
    !userIdPattern.test(body.userId) ||
    body.userId === user.id ||
    !isMarketplaceRole(body.role)
  ) {
    return Response.json(
      { message: "Choose another account and a valid badge." },
      { status: 400 },
    );
  }

  if (role !== "admin") {
    return Response.json(
      {
        message:
          "Only the ADMIN account can change marketplace roles, including Marketplace Admin and ADMIN badges.",
      },
      { status: 403 },
    );
  }

  const { data, error } = await client
    .from("marketplace_profiles")
    .update({ role: body.role })
    .eq("user_id", body.userId)
    .select("user_id, email, display_name, role, created_at")
    .maybeSingle();

  if (error) {
    console.error("Failed to update marketplace badge:", error.message);
    return Response.json(
      { message: "The marketplace badge could not be updated." },
      { status: 500 },
    );
  }
  if (!data) {
    return Response.json(
      { message: "Marketplace account not found." },
      { status: 404 },
    );
  }

  return Response.json({ user: data });
}
