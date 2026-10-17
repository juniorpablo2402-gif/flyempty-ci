import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export async function GET(){
 const supabase=createSupabaseServerClient();
 const {data}=await supabase.auth.getClaims(); const userId=data?.claims?.sub;
 if(!userId)return NextResponse.json({error:"Connexion requise."},{status:401});
 const {data:profile}=await supabase.from("profiles").select("role").eq("id",userId).maybeSingle();
 if(profile?.role!=="admin")return NextResponse.json({error:"Accès administrateur requis."},{status:403});
 const {data:logs,error}=await supabase.from("admin_audit_logs").select("id,entity_type,action,details,created_at").order("created_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Historique indisponible."},{status:400});
 return NextResponse.json({logs:logs??[]});
}
