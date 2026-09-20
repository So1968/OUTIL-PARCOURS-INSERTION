import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="status-page">
      <section className="status-page__card">
        <p className="status-page__label">Page introuvable</p>
        <h1>Ce chemin n’existe pas ou n’est plus utilisé.</h1>
        <p>Revenez à l’accueil pour reprendre le travail depuis une entrée valide.</p>
        <Link to="/">Retour à l’accueil</Link>
      </section>
    </main>
  );
}
