export const authSetupMessage =
  "Shared sign-in is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the environment, then redeploy.";

export const confirmationRedirectSetupMessage =
  "Set NEXT_PUBLIC_SITE_URL to your live website URL before registering from localhost, then restart the development server. For example: NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app";

export const authRateLimitMessage =
  "Email sending is rate-limited right now. Supabase's built-in mailer allows only a couple of messages per hour and only to organization addresses. Configure custom SMTP in Supabase → Authentication → SMTP Settings, then try again.";

export function isAuthRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const status = "status" in error ? error.status : undefined;
  const message = "message" in error ? error.message : undefined;
  const code = "code" in error ? String(error.code).toLowerCase() : "";
  return (
    status === 429 ||
    code.includes("rate_limit") ||
    (typeof message === "string" &&
      /rate.?limit|too many requests/i.test(message))
  );
}

export function getAuthErrorMessage(
  error: unknown,
  operation: "register" | "sign-in" | "reset",
): string {
  if (isAuthRateLimitError(error)) return authRateLimitMessage;

  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code).toLowerCase()
      : "";

  if (
    code.includes("user_already_exists") ||
    code.includes("email_exists") ||
    normalizedMessage.includes("already registered")
  ) {
    return "This email already has an account. Switch to Sign in instead.";
  }

  if (normalizedMessage.includes("database error saving new user")) {
    return "The account was created, but its marketplace profile could not be saved. Run the latest supabase/schema.sql in this app's Supabase project, then try again.";
  }

  if (
    normalizedMessage.includes("email address not authorized") ||
    normalizedMessage.includes("email not authorized")
  ) {
    return "Supabase's built-in email service only sends to addresses belonging to your Supabase organization. To let students register with school or personal addresses, configure custom SMTP in Supabase Dashboard → Authentication → SMTP Settings.";
  }

  if (
    normalizedMessage.includes("password") &&
    (normalizedMessage.includes("weak") ||
      normalizedMessage.includes("short") ||
      normalizedMessage.includes("at least"))
  ) {
    return `That password was rejected: ${message}`;
  }

  if (
    normalizedMessage.includes("signup is disabled") ||
    normalizedMessage.includes("signups not allowed")
  ) {
    return "New registrations are disabled in this Supabase project. Enable public sign-ups in Supabase Authentication settings.";
  }

  if (operation === "sign-in" && normalizedMessage.includes("invalid login")) {
    return "Email or password is incorrect. Check the spelling and try again. If you just registered, confirm your email first.";
  }

  return (
    message ||
    (operation === "register"
      ? "Registration failed. Please try again."
      : operation === "reset"
        ? "The reset email could not be sent. Please try again."
        : "Sign-in failed. Please try again.")
  );
}

export function getConfirmationRedirectUrl(): string | null {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    !configuredSiteUrl &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
  ) {
    return null;
  }

  const siteUrl = new URL(configuredSiteUrl || window.location.origin);
  if (
    (siteUrl.protocol !== "https:" && siteUrl.hostname !== "localhost") ||
    siteUrl.username ||
    siteUrl.password
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid website URL.");
  }

  return new URL("/", siteUrl).toString();
}
