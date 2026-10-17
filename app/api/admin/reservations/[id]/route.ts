import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const statuses = new Set(["pending", "contacted", "confirmed", "declined", "cancelled"]);

async function adminContext() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return { response: NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { supabase, userId };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await adminContext();
  if ("response" in ctx) return ctx.response;
  try {
    const body = await request.json();
    const status = String(body.status ?? "");
    const admin_notes = String(body.admin_notes ?? "").trim();
    if (!statuses.has(status) || admin_notes.length > 3000) return NextResponse.json({ error: "Statut ou note invalide." }, { status: 400 });
    const { data: before } = await ctx.supabase.from("reservation_requests").select("status").eq("id", params.id).maybeSingle();
    const { data, error } = await ctx.supabase.from("reservation_requests").update({ status, admin_notes: admin_notes || null, updated_at: new Date().toISOString() }).eq("id", params.id).select("id,status,admin_notes").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Mise à jour impossible. Vérifiez les droits RLS." }, { status: 400 });
    await ctx.supabase.from("admin_audit_logs").insert({ actor_id: ctx.userId, entity_type: "reservation", entity_id: params.id, action: "reservation_updated", details: { from: before?.status ?? null, to: status, has_note: Boolean(admin_notes) } });
    return NextResponse.json({ reservation: data });
  } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
}
