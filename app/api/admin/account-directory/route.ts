import { requireMarketingAdmin } from "@/lib/supabase/require-marketing-admin";

export async function GET() {
  const { client, response, role } = await requireMarketingAdmin();
  if (response || !client) {
    return response ?? Response.json(
      { message: "Admin access could not be verified." },
      { status: 500 },
    );
  }
  if (role !== "admin") {
    return Response.json(
      { message: "Only the ADMIN account can view the account directory." },
      { status: 403 },
    );
  }

  const { data, error } = await client
    .from("marketplace_profiles")
    .select("email")
    .order("email", { ascending: true });

  if (error) {
    console.error("Failed to load ADMIN account directory:", error.message);
    return Response.json(
      { message: "Registered email addresses could not be loaded." },
      { status: 500 },
    );
  }

  return Response.json({ emails: data.map(({ email }) => email) });
}
