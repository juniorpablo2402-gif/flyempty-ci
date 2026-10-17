import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
async function adminContext() {
 const supabase=createSupabaseServerClient(); const {data}=await supabase.auth.getClaims(); const userId=data?.claims?.sub;
 if(!userId)return {response:NextResponse.json({error:"Connexion requise."},{status:401})};
 const {data:profile}=await supabase.from("profiles").select("role").eq("id",userId).maybeSingle();
 if(profile?.role!=="admin")return {response:NextResponse.json({error:"Accès administrateur requis."},{status:403})};
 return {supabase,userId};
}
export async function PATCH(request:Request,{params}:{params:{id:string}}){
 const ctx=await adminContext();if("response" in ctx)return ctx.response;
 try{
  const body=await request.json();const {data:old}=await ctx.supabase.from("flights").select("*").eq("id",params.id).maybeSingle();
  if(!old)return NextResponse.json({error:"Vol introuvable."},{status:404});
  const status=String(body.status??old.status);
  if(!["draft","published","cancelled","completed"].includes(status))return NextResponse.json({error:"Statut invalide."},{status:400});
  if(status==="published"&&old.is_demo)return NextResponse.json({error:"Une offre démo ne peut pas être publiée."},{status:400});
  const updates:Record<string,unknown>={status,updated_at:new Date().toISOString()};
  if(body.origin_city!==undefined){
   const origin_city=String(body.origin_city??"").trim(),origin_code=String(body.origin_code??"").trim().toUpperCase(),destination_city=String(body.destination_city??"").trim(),destination_code=String(body.destination_code??"").trim().toUpperCase(),departure_at=String(body.departure_at??"");
   const estimated_duration_minutes=Number(body.estimated_duration_minutes),indicative_price_xof=Number(body.indicative_price_xof),available_seats=Number(body.available_seats),aircraft_label=String(body.aircraft_label??"").trim(),flight_type=String(body.flight_type??"empty_leg"),is_demo=body.is_demo===true;
   if(!origin_city||!destination_city||origin_city===destination_city||!/^[A-Z0-9]{3,4}$/.test(origin_code)||!/^[A-Z0-9]{3,4}$/.test(destination_code)||!departure_at||!Number.isFinite(Date.parse(departure_at))||!Number.isInteger(estimated_duration_minutes)||estimated_duration_minutes<1||!Number.isInteger(indicative_price_xof)||indicative_price_xof<0||!Number.isInteger(available_seats)||available_seats<1||!["empty_leg","repositioning","available_seats"].includes(flight_type))return NextResponse.json({error:"Vérifiez les champs du vol."},{status:400});
   if(status==="published"&&is_demo)return NextResponse.json({error:"Une offre démo ne peut pas être publiée."},{status:400});
   Object.assign(updates,{origin_city,origin_code,destination_city,destination_code,departure_at:new Date(departure_at).toISOString(),estimated_duration_minutes,indicative_price_xof,available_seats,aircraft_label:aircraft_label||null,flight_type,is_demo});
  }
  const {data,error}=await ctx.supabase.from("flights").update(updates).eq("id",params.id).select("*").maybeSingle();
  if(error||!data)return NextResponse.json({error:"Modification impossible. Vérifiez les données et les droits de la base."},{status:400});
  await ctx.supabase.from("admin_audit_logs").insert({actor_id:ctx.userId,entity_type:"flight",entity_id:params.id,action:"flight_updated",details:{from:old.status,to:data.status,fields_edited:body.origin_city!==undefined}});
  return NextResponse.json({flight:data});
 }catch{return NextResponse.json({error:"Requête invalide."},{status:400});}
}
