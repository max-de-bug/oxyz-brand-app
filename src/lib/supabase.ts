import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "supabase.auth.token",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    autoRefreshToken: true,
  },
});

// Helper function to get user profile from Supabase
export async function getUserProfile() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      image: user.user_metadata?.avatar_url,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}
