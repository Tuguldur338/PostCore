import { requireMarketingAdmin } from "@/lib/supabase/require-marketing-admin";

const marketplaceRoles = ["student", "marketplace_admin", "admin"] as const;
type MarketplaceRole = (typeof marketplaceRoles)[number];

const primaryAdminEmail = "tuguldur09252@gmail.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isMarketplaceRole(value: unknown): value is MarketplaceRole {
  return (
    typeof value === "string" &&
    marketplaceRoles.some((role) => role === value)
  );
}

export async function GET() {
  const { client, response, role } = await requireMarketingAdmin();
  if (response || !client) {
    return (
      response ??
      Response.json(
        { message: "Admin access could not be verified." },
        { status: 500 },
      )
    );
  }
  if (role !== "admin") {
    return Response.json(
      { message: "Only the ADMIN account can view or change marketplace badges." },
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
    return (
      response ??
      Response.json(
        { message: "Admin access could not be verified." },
        { status: 500 },
      )
    );
  }
  if (role !== "admin") {
    return Response.json(
      { message: "Only the ADMIN account can change marketplace badges." },
      { status: 403 },
    );
  }

  let body: { email?: unknown; role?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; role?: unknown };
  } catch {
    return Response.json(
      { message: "The badge update must contain valid JSON." },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.email !== "string" ||
    body.email.trim().length === 0 ||
    body.email.trim().length > 320 ||
    !emailPattern.test(body.email.trim()) ||
    !isMarketplaceRole(body.role)
  ) {
    return Response.json(
      { message: "Search for a valid account email and choose a badge." },
      { status: 400 },
    );
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const signedInEmail = user.email?.trim().toLowerCase() ?? "";

  if (normalizedEmail === signedInEmail) {
    return Response.json(
      { message: "You cannot change your own marketplace badge." },
      { status: 403 },
    );
  }

  if (normalizedEmail === primaryAdminEmail) {
    return Response.json(
      { message: "The primary ADMIN account's badge is protected." },
      { status: 403 },
    );
  }

  const { data: account, error: lookupError } = await client
    .from("marketplace_profiles")
    .select("user_id, email, display_name, role, created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to find marketplace account:", lookupError.message);
    return Response.json(
      { message: "The marketplace account could not be found." },
      { status: 500 },
    );
  }
  if (!account) {
    return Response.json(
      { message: "No registered account uses that email address." },
      { status: 404 },
    );
  }

  const { data, error } = await client
    .from("marketplace_profiles")
    .update({ role: body.role })
    .eq("user_id", account.user_id)
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
