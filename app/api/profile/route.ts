import { getSupabaseConfig, supabaseSetupMessage } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!getSupabaseConfig()) {
    return Response.json({ message: supabaseSetupMessage }, { status: 503 });
  }

  const client = await createSupabaseServerClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) {
    return Response.json({ message: "Sign in to load your profile." }, { status: 401 });
  }

  const { data: profile, error } = await client
    .from("marketplace_profiles")
    .select("user_id, email, display_name, role")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to retrieve marketplace profile:", error.message);
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      (error.message.includes("marketplace_profiles") &&
        error.message.includes("schema cache"))
    ) {
      return Response.json(
        {
          message:
            "Marketplace account setup is incomplete. Run the latest supabase/schema.sql in the SQL Editor for the Supabase project configured by this app, then sign in again.",
        },
        { status: 503 },
      );
    }

    return Response.json(
      { message: "Your marketplace profile could not be loaded." },
      { status: 500 },
    );
  }
  if (!profile) {
    return Response.json(
      {
        message:
          "Your marketplace profile is unavailable. Run the latest supabase/schema.sql and sign in again.",
      },
      { status: 404 },
    );
  }

  return Response.json({ profile });
}
