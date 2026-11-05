import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError?.name === "AuthSessionMissingError") return null;
  if (authError) throw new Error(`Could not verify session: ${authError.message}`);
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load user profile: ${error.message}`);
  return data as Profile | null;
}

export async function requireRole(roles: UserRole[]) {
  const profile = await getProfile();
  if (!profile || !roles.includes(profile.role)) redirect("/login");
  return profile;
}

export async function requireAdmin() {
  return requireRole(["admin", "super_admin"]);
}

export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}
