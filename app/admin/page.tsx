import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminDashboard from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let supabase;
  try { supabase = createSupabaseServerClient(); } catch { redirect("/admin/login"); }
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return <main className="admin-page"><div className="admin-top"><Link className="brand" href="/"><span className="brand-mark">F</span><span>FLYEMPTY CI<small>ESPACE ADMINISTRATEUR</small></span></Link></div><section className="admin-denied"><h1>Accès non autorisé.</h1><p>Votre compte est connecté, mais ne dispose pas du rôle administrateur. Demandez à un administrateur principal de vous attribuer cet accès.</p><Link className="back-link" href="/">Retour au site</Link></section></main>;
  const [{ data: requests }, { data: flights }] = await Promise.all([
    supabase.from("reservation_requests").select("id,reference_code,origin_city,destination_city,requested_departure_date,passenger_count,contact_name,contact_email,contact_phone,status,created_at,customer_message,admin_notes").order("created_at", { ascending: false }).limit(250),
    supabase.from("flights").select("*").order("departure_at", { ascending: false }).limit(250),
  ]);
  return <AdminDashboard initialReservations={requests ?? []} initialFlights={flights ?? []} displayName={profile.display_name || "administrateur"} />;
}
