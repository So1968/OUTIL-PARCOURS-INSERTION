import { Link, useLocation } from "react-router-dom";

export function AccessDeniedPage() {
  const { state } = useLocation();

  return (
    <main className="status-page">
      <section className="status-page__card" role="alert">
        <p className="status-page__label">Accès limité</p>
        <h1>Cet espace n’est pas ouvert à ce profil.</h1>
        <p>
          Profil actif : <strong>{state?.deniedRoleLabel || "non reconnu"}</strong>.
          Les droits sont simulés dans ce prototype et devront être contrôlés par le serveur en production.
        </p>
        <Link to="/">Retour à l’accueil</Link>
      </section>
    </main>
  );
}
