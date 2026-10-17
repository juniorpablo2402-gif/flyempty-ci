import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cities = new Set(["Abidjan", "San-Pédro", "Bouaké", "Korhogo"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = String(body.origin ?? "").trim();
    const destination = String(body.destination ?? "").trim();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    const passengers = Number(body.passengers);
    const date = body.date ? String(body.date) : null;

    if (!cities.has(origin) || !cities.has(destination) || origin === destination) {
      return NextResponse.json({ error: "Choisissez deux villes différentes." }, { status: 400 });
    }
    if (name.length < 2 || name.length > 120 || phone.length < 6 || phone.length > 30) {
      return NextResponse.json({ error: "Vérifiez votre nom et votre numéro de téléphone." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "L’adresse e-mail semble invalide." }, { status: 400 });
    }
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 20 || message.length > 1500) {
      return NextResponse.json({ error: "Vérifiez le nombre de passagers ou la longueur du message." }, { status: 400 });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "La date choisie est invalide." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Le service de réservation n’est pas encore configuré." }, { status: 503 });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("submit_reservation_request", {
      p_origin_city: origin,
      p_destination_city: destination,
      p_requested_departure_date: date,
      p_passenger_count: passengers,
      p_contact_name: name,
      p_contact_email: email || null,
      p_contact_phone: phone,
      p_customer_message: message || null,
      p_flight_id: null,
    });

    if (error || !data?.[0]?.reference_code) {
      console.error("Reservation request rejected", error?.code ?? "unknown");
      return NextResponse.json({ error: "Impossible d’enregistrer la demande. Réessayez dans un instant." }, { status: 500 });
    }
    return NextResponse.json({ reference: data[0].reference_code }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "La demande n’a pas pu être traitée." }, { status: 400 });
  }
}
