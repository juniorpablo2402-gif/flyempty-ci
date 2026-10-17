import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function GET() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({flights:[]});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await supabase.from("flights").select("id,origin_city,origin_code,destination_city,destination_code,departure_at,estimated_duration_minutes,indicative_price_xof,available_seats,aircraft_label,flight_type,status,is_demo").eq("status","published").eq("is_demo",false).gte("departure_at",new Date().toISOString()).order("departure_at",{ascending:true}).limit(50);
 if(error)return NextResponse.json({error:"Catalogue momentanément indisponible."},{status:503});
 return NextResponse.json({flights:data??[]},{headers:{"Cache-Control":"no-store"}});
}
