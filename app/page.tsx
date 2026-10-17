"use client";

import { useEffect, useMemo, useState } from "react";

type Flight = {
  id: number | string;
  from: string;
  to: string;
  code: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  seats: number;
  kind: string;
  isDemo?: boolean;
};

const demoFlights: Flight[] = [
  { id: 1, from: "Abidjan", to: "San-Pédro", code: "ABJ → SPY", date: "22 OCT. 2026", time: "09:30", duration: "45 min", price: 85000, seats: 3, kind: "Vol à repositionner" },
  { id: 2, from: "Abidjan", to: "Bouaké", code: "ABJ → BYK", date: "24 OCT. 2026", time: "14:15", duration: "35 min", price: 65000, seats: 2, kind: "Sièges disponibles" },
  { id: 3, from: "Korhogo", to: "Abidjan", code: "HGO → ABJ", date: "26 OCT. 2026", time: "11:00", duration: "1 h 10", price: 110000, seats: 4, kind: "Vol à repositionner" },
];

const money = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export default function Home() {
  const [origin, setOrigin] = useState("Toutes les villes");
  const [destination, setDestination] = useState("Toutes les villes");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<Flight | null>(null);
  const [notice, setNotice] = useState("");
  const [liveFlights, setLiveFlights] = useState<Flight[]>([]);
  const [liveCatalogueLoaded, setLiveCatalogueLoaded] = useState(false);
  useEffect(() => { let active = true; fetch("/api/flights", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then(body => { if (!active) return; const mapped: Flight[] = (body.flights ?? []).map((f: {id:string;origin_city:string;origin_code:string;destination_city:string;destination_code:string;departure_at:string;estimated_duration_minutes:number;indicative_price_xof:number;available_seats:number;flight_type:string}) => ({ id:f.id, from:f.origin_city, to:f.destination_city, code:f.origin_code+" → "+f.destination_code, date:new Date(f.departure_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase(), time:new Date(f.departure_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}), duration:f.estimated_duration_minutes >= 60 ? Math.floor(f.estimated_duration_minutes/60)+" h "+(f.estimated_duration_minutes%60 ? f.estimated_duration_minutes%60+" min" : "") : f.estimated_duration_minutes+" min", price:f.indicative_price_xof, seats:f.available_seats, kind:f.flight_type==="empty_leg"?"Vol à vide":f.flight_type==="available_seats"?"Sièges disponibles":"Vol de repositionnement", isDemo:false })); setLiveFlights(mapped); setLiveCatalogueLoaded(true); }).catch(() => { if(active) setLiveCatalogueLoaded(true); }); return () => { active = false; }; }, []);
  const catalogue = liveFlights.length ? liveFlights : demoFlights.map(f => ({...f,isDemo:true}));
  const usingDemo = liveFlights.length === 0;
  const flights = useMemo(() => catalogue.filter((f) =>
    (origin === "Toutes les villes" || f.from === origin) &&
    (destination === "Toutes les villes" || f.to === destination) &&
    (!date || f.date.includes(date))
  ), [catalogue, origin, destination, date]);

  function swapRoute() {
    setOrigin(destination);
    setDestination(origin);
  }

  function resetSearch() {
    setOrigin("Toutes les villes");
    setDestination("Toutes les villes");
    setDate("");
  }

  function requestBooking(flight: Flight) {
    window.location.href = "/reservation";
  }

  return (
    <main>
      {usingDemo && <div className="demo-bar"><span className="demo-dot" /> VERSION DÉMO · Les vols et tarifs affichés sont fictifs et non réservables</div>}
      <header className="header wrap">
        <a className="brand" href="#" aria-label="FlyEmpty CI accueil"><span className="brand-mark">F</span><span>FLYEMPTY<span className="brand-ci"> CI</span><small>L’AVIATION, AUTREMENT</small></span></a>
        <nav><a href="#vols">Explorer les vols</a><a href="#concept">Le concept</a><a className="nav-cta" href="/reservation">Demander un vol <span>↗</span></a></nav>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="wrap hero-inner">
          <div className="eyebrow"><span /> LA NOUVELLE FAÇON DE VOLER EN CÔTE D’IVOIRE</div>
          <h1>Le ciel est plus<br />proche que <em>jamais.</em></h1>
          <p className="hero-copy">Repérez les places disponibles et les vols de repositionnement. Une autre manière de voyager, plus flexible, pensée pour les trajets qui comptent.</p>
          <div className="hero-points"><span><b>✳</b> Opportunités de vols</span><span><b>↗</b> Trajets régionaux</span><span><b>◈</b> Demande simplifiée</span></div>
          <div className="search-panel">
            <div className="search-heading"><span>VOTRE PROCHAIN TRAJET</span><span className="search-step">01 <i>/</i> 03</span></div>
            <div className="search-fields">
              <label><span>AU DÉPART DE</span><select value={origin} onChange={e => setOrigin(e.target.value)}><option>Toutes les villes</option><option>Abidjan</option><option>San-Pédro</option><option>Bouaké</option><option>Korhogo</option></select></label>
              <button className="swap" type="button" onClick={swapRoute} aria-label="Inverser le départ et la destination" title="Inverser le trajet">⇄</button>
              <label><span>À DESTINATION DE</span><select value={destination} onChange={e => setDestination(e.target.value)}><option>Toutes les villes</option><option>Abidjan</option><option>San-Pédro</option><option>Bouaké</option><option>Korhogo</option></select></label>
              <label className="date-field"><span>DATE SOUHAITÉE (OPTIONNEL)</span><input aria-label="Date souhaitée" value={date} onChange={e => setDate(e.target.value.toUpperCase())} placeholder="Ex. 22 OCT. 2026" /></label>
              <a className="search-button" href="#vols">Explorer <span>↗</span></a>
            </div>
            <p className="search-note">Les demandes restent soumises à confirmation de l’opérateur aérien.</p>
          </div>
        </div>
        <div className="hero-bottom wrap"><span>ABIDJAN · CÔTE D’IVOIRE</span><span>5°20′ N — 4°01′ O</span></div>
      </section>

      <section className="flights-section wrap" id="vols">
        <div className="section-top"><div><div className="eyebrow dark"><span /> LES OPPORTUNITÉS</div><h2>Des trajets à <em>redécouvrir.</em></h2><p>{usingDemo ? "Exemples de présentation — aucune offre réelle publiée pour le moment." : "Offres publiées par l’équipe — disponibilité et tarif final à confirmer manuellement."}</p></div><div className="results-tools"><span className="count">{flights.length.toString().padStart(2, "0")} <small>{usingDemo ? "EXEMPLES" : "OFFRES"}</small></span><button className="reset-button" type="button" onClick={resetSearch}>Réinitialiser <span>↺</span></button></div></div>
        {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Fermer">×</button></div>}
        <div className="flight-grid">
          {flights.map((flight) => <article className="flight-card" key={flight.id}>
            <div className="flight-card-top"><span className="flight-type"><i /> {flight.kind}</span><span className="flight-index">0{flight.id}</span></div>
            <div className="route"><div><span className="airport-code">{flight.code.split(" → ")[0]}</span><strong>{flight.from}</strong></div><div className="route-line"><span>✈</span><i /></div><div className="destination"><span className="airport-code">{flight.code.split(" → ")[1]}</span><strong>{flight.to}</strong></div></div>
            <div className="flight-meta"><div><span>DATE</span><strong>{flight.date}</strong></div><div><span>DÉPART</span><strong>{flight.time}</strong></div><div><span>DURÉE EST.</span><strong>{flight.duration}</strong></div></div>
            <div className="card-footer"><div><span>À PARTIR DE</span><strong>{money(flight.price)}</strong><small>par personne · {flight.isDemo ? "prix fictif" : "prix indicatif à confirmer"}</small></div><button onClick={() => setSelected(flight)}>Détails <span>↗</span></button></div>
          </article>)}
          {flights.length === 0 && <div className="empty-state">Aucun exemple ne correspond à cette recherche. Modifiez les villes ou réinitialisez les filtres.</div>}
        </div>
        <div className="demo-disclaimer">{usingDemo ? "IMPORTANT — Aucun vol réel n’est publié pour le moment. Ces données fictives servent uniquement à tester l’interface." : "IMPORTANT — Les demandes restent soumises à vérification de disponibilité et de tarif. Aucun vol n’est réservé et aucun paiement n’est effectué sur ce site."}</div>
      </section>

      <section className="concept" id="concept"><div className="wrap concept-inner"><div><div className="eyebrow"><span /> LE CONCEPT FLYEMPTY</div><h2>Le bon vol.<br /><em>Au bon moment.</em></h2></div><div className="concept-copy"><p>Certains avions doivent rejoindre une autre ville, même sans passagers. D’autres vols disposent de sièges qui n’ont pas encore trouvé preneur.</p><p>FlyEmpty CI ambitionne de rendre ces opportunités plus visibles, avec une demande simple et une confirmation directement auprès des opérateurs partenaires.</p><span className="concept-note">UN PROJET EN CONSTRUCTION · CÔTE D’IVOIRE</span></div></div></section>

      <footer className="footer"><div className="wrap footer-inner"><a className="brand" href="#"><span className="brand-mark">F</span><span>FLYEMPTY<span className="brand-ci"> CI</span><small>L’AVIATION, AUTREMENT</small></span></a><span>© 2026 FLYEMPTY CI · PROTOTYPE EN CONSTRUCTION</span><a href="#vols">Retour en haut ↑</a></div></footer>

      {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Fermer">×</button><div className="eyebrow dark"><span /> DÉTAILS DE L’EXEMPLE</div><h2 id="modal-title">{selected.from} <em>→</em> {selected.to}</h2><p className="modal-intro">Exemple de fiche de vol — aucune disponibilité réelle n’a été vérifiée.</p><div className="modal-details"><div><span>DATE INDICATIVE</span><strong>{selected.date}</strong></div><div><span>HEURE</span><strong>{selected.time}</strong></div><div><span>DURÉE ESTIMÉE</span><strong>{selected.duration}</strong></div><div><span>PLACES EXEMPLE</span><strong>{selected.seats}</strong></div></div><div className="modal-price"><span>PRIX FICTIF PAR PERSONNE</span><strong>{money(selected.price)}</strong></div><button className="modal-action" onClick={() => requestBooking(selected)}>Simuler une demande <span>↗</span></button><p className="modal-footnote">Cette action ne réserve pas de billet et ne déclenche aucun paiement.</p></section></div>}
    </main>
  );
}
