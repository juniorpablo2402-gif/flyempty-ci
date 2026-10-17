"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) { setError("La connexion à la base n’est pas configurée."); setBusy(false); return; }
    const supabase = createClient(url, key);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (authError) { setError("Connexion impossible. Vérifiez vos identifiants ou l’accès au compte."); setBusy(false); return; }
    window.location.assign("/admin");
  }
  return <main className="admin-login-page"><Link className="brand" href="/"><span className="brand-mark">F</span><span>FLYEMPTY<span className="brand-ci"> CI</span><small>ESPACE ADMINISTRATEUR</small></span></Link><form className="admin-login-card" onSubmit={signIn}><div className="eyebrow dark"><span /> ACCÈS PRIVÉ</div><h1>Bienvenue <em>à nouveau.</em></h1><p>Connectez-vous avec un compte administrateur autorisé.</p><label>Adresse e-mail<input type="email" name="email" autoComplete="username" required /></label><label>Mot de passe<input type="password" name="password" autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="modal-action" disabled={busy}>{busy ? "Connexion…" : "Se connecter"} <span>↗</span></button><Link className="back-link" href="/">Retour au site</Link></form></main>;
}
