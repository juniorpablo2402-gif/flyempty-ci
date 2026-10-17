"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const cities = ["Abidjan", "San-Pédro", "Bouaké", "Korhogo"];

export default function ReservationPage() {
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      origin: form.get("origin"),
      destination: form.get("destination"),
      date: form.get("date") || null,
      passengers: Number(form.get("passengers")),
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      message: form.get("message"),
    };
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Une erreur est survenue.");
      setReference(result.reference);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’envoyer la demande.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="request-page">
    <header className="request-header wrap"><Link className="brand" href="/"><span className="brand-mark">F</span><span>FLYEMPTY<span className="brand-ci"> CI</span><small>L’AVIATION, AUTREMENT</small></span></Link><Link href="/">← Retour aux vols</Link></header>
    <section className="request-shell">
      <div className="request-intro"><div className="eyebrow"><span /> VOTRE PROCHAIN TRAJET</div><h1>Parlons de votre <em>voyage.</em></h1><p>Envoyez votre demande : notre équipe devra vérifier les disponibilités et vous recontacter. Aucun billet n’est réservé à cette étape.</p><div className="request-step"><span>01</span><div><strong>Votre demande</strong><small>Trajet et coordonnées</small></div></div><div className="request-step"><span>02</span><div><strong>Vérification manuelle</strong><small>Disponibilité et tarif à confirmer</small></div></div><div className="request-step"><span>03</span><div><strong>Confirmation par l’équipe</strong><small>Aucun paiement sur ce formulaire</small></div></div></div>
      <div className="request-form-wrap">
        {reference ? <div className="request-success" role="status"><span className="success-mark">✓</span><div className="eyebrow dark"><span /> DEMANDE ENREGISTRÉE</div><h2>Merci pour votre confiance.</h2><p>Votre référence de suivi :</p><strong className="request-reference">{reference}</strong><p>Conservez cette référence. Votre demande attend une vérification manuelle ; ce n’est pas une réservation confirmée.</p><button className="modal-action" onClick={() => setReference("")}>Envoyer une autre demande ↗</button><Link className="back-link" href="/">Retour à l’accueil</Link></div> :
        <form className="request-form" onSubmit={submit}>
          <div className="form-title"><span>FORMULAIRE DE DEMANDE</span><small>* Champs obligatoires</small></div>
          <div className="request-grid"><label>Ville de départ *<select name="origin" required defaultValue=""><option value="" disabled>Choisir une ville</option>{cities.map(city => <option key={city}>{city}</option>)}</select></label><label>Destination *<select name="destination" required defaultValue=""><option value="" disabled>Choisir une ville</option>{cities.map(city => <option key={city}>{city}</option>)}</select></label><label>Date souhaitée<input name="date" type="date" min={new Date().toISOString().slice(0,10)} /></label><label>Nombre de passagers *<select name="passengers" defaultValue="1" required>{Array.from({length:20},(_,i)=><option key={i} value={i+1}>{i+1} {i===0?"passager":"passagers"}</option>)}</select></label><label>Nom complet *<input name="name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Votre nom et prénom" /></label><label>Téléphone *<input name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={30} required placeholder="+225 ..." /></label><label className="full-field">E-mail (facultatif)<input name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" /></label><label className="full-field">Informations complémentaires<textarea name="message" maxLength={1500} rows={4} placeholder="Précisez vos contraintes ou préférences (facultatif)" /></label></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="modal-action request-submit" disabled={busy}>{busy ? "Envoi en cours…" : "Envoyer ma demande"} <span>↗</span></button>
          <p className="form-legal">En envoyant ce formulaire, vous demandez à être recontacté. La disponibilité, le tarif et toute réservation doivent être confirmés par l’équipe. Aucun paiement n’est effectué ici.</p>
        </form>}
      </div>
    </section>
  </main>;
}
