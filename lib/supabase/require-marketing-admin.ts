import { getSupabaseConfig, supabaseSetupMessage } from "./config";
import { createSupabaseServerClient } from "./server";

type MarketplaceRole = "admin" | "marketplace_admin";

export async function requireMarketingAdmin() {
  if (!getSupabaseConfig()) {
    return {
      client: null,
      role: null,
      response: Response.json(
        { message: supabaseSetupMessage },
        { status: 503 },
      ),
    };
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return {
      client: null,
      role: null,
      response: Response.json(
        { message: "Sign in with a marketplace admin account to continue." },
        { status: 401 },
      ),
    };
  }

  const { data: profile, error: profileError } = await client
    .from("marketplace_profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to verify marketplace role:", profileError.message);
    return {
      client: null,
      role: null,
      response: Response.json(
        { message: "Marketplace admin access could not be verified." },
        { status: 500 },
      ),
    };
  }

  if (
    !profile ||
    (profile.role !== "admin" && profile.role !== "marketplace_admin")
  ) {
    return {
      client: null,
      role: null,
      response: Response.json(
        { message: "Only marketplace admins can access this area." },
        { status: 403 },
      ),
    };
  }

  return {
    client,
    role: profile.role as MarketplaceRole,
    response: null,
    user: data.user,
  };
}
