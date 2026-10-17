import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig, supabaseSetupMessage } from "@/lib/supabase/config";

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
    return Response.json(
      { message: "Your marketplace profile could not be loaded." },
      { status: 500 },
    );
  }
  if (!profile) {
    return Response.json(
      { message: "Your marketplace profile is not ready. Please try again after confirming your email." },
      { status: 404 },
    );
  }

  return Response.json({ profile });
}
