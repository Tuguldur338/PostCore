import { getSupabaseConfig, supabaseSetupMessage } from "./config";
import { createSupabaseServerClient } from "./server";

export async function requireMarketingAdmin() {
  if (!getSupabaseConfig()) {
    return {
      client: null,
      response: Response.json(
        { message: supabaseSetupMessage },
        { status: 503 },
      ),
    };
  }

  const adminEmail = process.env.MARKETING_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return {
      client: null,
      response: Response.json(
        { message: "The marketing admin account is not configured." },
        { status: 503 },
      ),
    };
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return {
      client: null,
      response: Response.json(
        { message: "Sign in with the marketing admin account to continue." },
        { status: 401 },
      ),
    };
  }

  if (
    data.user.email?.trim().toLowerCase() !== adminEmail ||
    data.user.app_metadata.role !== "marketing_admin"
  ) {
    return {
      client: null,
      response: Response.json(
        { message: "Only the authorized marketing admin can access this area." },
        { status: 403 },
      ),
    };
  }

  return { client, response: null, user: data.user };
}
