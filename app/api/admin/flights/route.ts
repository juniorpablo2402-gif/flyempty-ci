import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
async function adminContext() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return { response: NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { supabase, userId };
}
function parseFlight(body: Record<string, unknown>) {
  const origin_city = String(body.origin_city ?? "").trim();
  const origin_code = String(body.origin_code ?? "").trim().toUpperCase();
  const destination_city = String(body.destination_city ?? "").trim();
  const destination_code = String(body.destination_code ?? "").trim().toUpperCase();
  const departure_at = String(body.departure_at ?? "");
  const estimated_duration_minutes = Number(body.estimated_duration_minutes);
  const indicative_price_xof = Number(body.indicative_price_xof);
  const available_seats = Number(body.available_seats);
  const aircraft_label = String(body.aircraft_label ?? "").trim();
  const flight_type = String(body.flight_type ?? "empty_leg");
  const is_demo = body.is_demo !== false;
  const status = String(body.status ?? "draft");
  if (!origin_city || !destination_city || origin_city === destination_city || !/^[A-Z0-9]{3,4}$/.test(origin_code) || !/^[A-Z0-9]{3,4}$/.test(destination_code) || !departure_at || !Number.isFinite(Date.parse(departure_at)) || !Number.isInteger(estimated_duration_minutes) || estimated_duration_minutes < 1 || !Number.isInteger(indicative_price_xof) || indicative_price_xof < 0 || !Number.isInteger(available_seats) || available_seats < 1 || !["empty_leg","repositioning","available_seats"].includes(flight_type) || !["draft","published","cancelled","completed"].includes(status)) throw new Error("Vérifiez les champs obligatoires du vol.");
  if (status === "published" && is_demo) throw new Error("Une offre de démonstration ne peut pas être publiée. Désactivez le mode démo uniquement pour une offre réelle vérifiée.");
  return { origin_city, origin_code, destination_city, destination_code, departure_at: new Date(departure_at).toISOString(), estimated_duration_minutes, indicative_price_xof, available_seats, aircraft_label: aircraft_label || null, flight_type, is_demo, status, updated_at: new Date().toISOString() };
}
export async function GET() {
 const ctx = await adminContext(); if ("response" in ctx) return ctx.response;
 const { data, error } = await ctx.supabase.from("flights").select("*").order("departure_at",{ascending:false}).limit(250);
 if (error) return NextResponse.json({ error: "Chargement des vols impossible." }, { status: 400 });
 return NextResponse.json({ flights: data ?? [] });
}
export async function POST(request: Request) {
 const ctx = await adminContext(); if ("response" in ctx) return ctx.response;
 try {
  const flight = parseFlight(await request.json());
  const { data, error } = await ctx.supabase.from("flights").insert(flight).select("*").single();
  if (error) return NextResponse.json({ error: "Création impossible. Vérifiez les données et les droits de la base." }, { status: 400 });
  await ctx.supabase.from("admin_audit_logs").insert({ actor_id: ctx.userId, entity_type: "flight", entity_id: data.id, action: "flight_created", details: { status: data.status, is_demo: data.is_demo } });
  return NextResponse.json({ flight: data }, { status: 201 });
 } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Données invalides." }, { status: 400 }); }
}
