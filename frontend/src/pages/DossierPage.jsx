import React from "react";
import { Link } from "react-router-dom";

export function DossierPage() {
  return (
    <main className="page-shell">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Dossier parcours</h1>
          <p className="page-intro">
            Vue de travail pour garder le fil du suivi.
          </p>
        </div>
      </header>

      <section className="page-card dossier-identity-card">
        <div>
          <h2>Identité du dossier</h2>
          <p><strong>Identifiant :</strong> XXXX</p>
        </div>

        <div className="identity-grid">
          <p><strong>Statut :</strong> en cours</p>
          <p><strong>Référente :</strong> ...</p>
          <p><strong>Ouverture :</strong> ...</p>
        </div>
      </section>

      <section className="dossier-layout">
        <div className="dossier-main">
          <section className="page-card">
            <h2>Situation actuelle</h2>
            <p><strong>Demande principale :</strong> ...</p>
            <p><strong>Résumé :</strong> ...</p>
            <p><strong>Point de vigilance :</strong> ...</p>
          </section>

          <section className="page-card">
            <h2>Parcours social / socio-professionnel</h2>
            <p><strong>Diagnostic :</strong> ...</p>
            <p><strong>Objectifs :</strong> ...</p>
            <p><strong>Actions prévues :</strong> ...</p>
            <p><strong>Évolution :</strong> ...</p>

            <Link className="primary-button" to="/parcours-social-socio-professionnel/socle">
              Commencer le socle autonomie
            </Link>
          </section>

          <section className="page-card">
            <h2>Historique / prochaines actions</h2>
            <p>Liste des actions à afficher ici.</p>
          </section>
        </div>

        <aside className="dossier-side">
          <section className="page-card">
            <h2>Appui TNS</h2>
            <p><strong>Besoin :</strong> oui / non</p>
            <p><strong>Problématique :</strong> ...</p>
            <p><strong>Intervention :</strong> ...</p>
            <p><strong>Orientation :</strong> ...</p>
          </section>

          <section className="page-card">
            <h2>Points de vigilance</h2>
            <p>Administratif · Budget · Santé · Logement · Mobilité · TNS</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
