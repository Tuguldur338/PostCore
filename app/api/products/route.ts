import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, supabaseSetupMessage } from "@/lib/supabase/config";

export async function GET() {
  const config = getSupabaseConfig();
  if (!config) {
    return Response.json({ message: supabaseSetupMessage }, { status: 503 });
  }

  const client = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data, error } = await client
    .from("products")
    .select(
      "id, name, price, badge, description, image, category, fits_for, pickup_class, pickup_room, pickup_method, quantity, is_available",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to retrieve products:", error.message);
    if (error.code === "42703" || error.code === "PGRST204") {
      return Response.json(
        {
          message:
            "The product catalog needs the latest schema. Run supabase/schema.sql in your Supabase project's SQL Editor, then reload this page.",
        },
        { status: 503 },
      );
    }
    if (error.code === "PGRST205" || error.code === "42P01") {
      return Response.json(
        {
          message:
            "The shared product catalog is not set up yet. Run supabase/schema.sql in your Supabase project's SQL Editor, then reload this page.",
        },
        { status: 503 },
      );
    }
    return Response.json(
      { message: "The product catalog could not be loaded." },
      { status: 500 },
    );
  }

  return Response.json({
    products: data.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      badge: product.badge,
      description: product.description,
      image: product.image,
      category: product.category,
      fitsFor: product.fits_for,
      pickupClass: product.pickup_class,
      pickupRoom: product.pickup_room,
      pickupMethod: product.pickup_method,
      ...(product.quantity === null ? {} : { quantity: product.quantity }),
      outOfStock: !product.is_available,
    })),
  });
}
