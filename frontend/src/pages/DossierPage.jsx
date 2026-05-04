import React from "react";
import { Link } from "react-router-dom";

export function DossierPage() {
  return (
    <main className="page-shell">
      <section className="page-card dossier-identity-card">
        <div>
          <h1>Dossier parcours</h1>
          <p>Identifiant : XXXX</p>
        </div>
        <div>
          <p>Statut : en cours</p>
          <p>Référente : ...</p>
          <p>Ouverture : ...</p>
        </div>
      </section>

      <section className="page-card">
        <h2>Situation actuelle</h2>
        <p><strong>Demande :</strong> ...</p>
        <p><strong>Résumé :</strong> ...</p>
        <p><strong>Vigilance :</strong> ...</p>
      </section>

      <section className="page-card">
        <h2>Parcours social / socio-professionnel</h2>
        <p><strong>Diagnostic :</strong> ...</p>
        <p><strong>Objectifs :</strong> ...</p>
        <p><strong>Actions :</strong> ...</p>
        <p><strong>Évolution :</strong> ...</p>

        <Link className="primary-button" to="/parcours-social-socio-professionnel/socle">
          Commencer le socle autonomie
        </Link>
      </section>

      <section className="page-card">
        <h2>Appui TNS</h2>
        <p><strong>Besoin :</strong> oui / non</p>
        <p><strong>Problématique :</strong> ...</p>
        <p><strong>Intervention :</strong> ...</p>
        <p><strong>Orientation :</strong> ...</p>
      </section>

      <section className="page-card">
        <h2>Historique / prochaines actions</h2>
        <p>Liste des actions à afficher ici</p>
      </section>
    </main>
  );
}
