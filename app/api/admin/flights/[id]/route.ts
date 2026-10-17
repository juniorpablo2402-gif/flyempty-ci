import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
async function adminContext() {
 const supabase = createSupabaseServerClient(); const { data } = await supabase.auth.getClaims(); const userId = data?.claims?.sub;
 if (!userId) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
 const { data: profile } = await supabase.from("profiles").select("role").eq("id",userId).maybeSingle();
 if (profile?.role !== "admin") return { response: NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }) };
 return { supabase, userId };
}
export async function PATCH(request: Request,{params}:{params:{id:string}}) {
 const ctx=await adminContext(); if("response" in ctx) return ctx.response;
 try {
  const body=await request.json();
  const allowed=["draft","published","cancelled","completed"];
  const status=String(body.status ?? "");
  if(!allowed.includes(status)) return NextResponse.json({error:"Statut invalide."},{status:400});
  const {data:old}=await ctx.supabase.from("flights").select("status,is_demo").eq("id",params.id).maybeSingle();
  if(!old) return NextResponse.json({error:"Vol introuvable."},{status:404});
  if(status==="published" && old.is_demo) return NextResponse.json({error:"Une offre démo ne peut pas être publiée comme vol réel."},{status:400});
  const {data,error}=await ctx.supabase.from("flights").update({status,updated_at:new Date().toISOString()}).eq("id",params.id).select("*").maybeSingle();
  if(error || !data) return NextResponse.json({error:"Modification impossible."},{status:400});
  await ctx.supabase.from("admin_audit_logs").insert({actor_id:ctx.userId,entity_type:"flight",entity_id:params.id,action:"flight_status_changed",details:{from:old.status,to:status}});
  return NextResponse.json({flight:data});
 } catch { return NextResponse.json({error:"Requête invalide."},{status:400}); }
}
