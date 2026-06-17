import React from "react";
import { Link } from "react-router-dom";
import "../sasInsertis.css";

export function SasInsertisPage() {
  return (
    <main className="sas-insertis-page">
      <header className="sas-insertis-header">
        <p className="sas-kicker">SAS SÉCURISÉ · INSERTIS · PRÉPARATION</p>
        <h1>Sas Insertis</h1>
        <p>
          Espace de travail intermédiaire pour préparer les notes, étapes et suites à saisir dans Insertis,
          sans extraction automatique et sans synchronisation.
        </p>
        <div className="sas-actions">
          <Link to="/" className="sas-secondary-button">← Retour accueil</Link>
          <a
            href="https://insertis.grandlyon.com/external-links"
            target="_blank"
            rel="noreferrer"
            className="sas-primary-button"
          >
            Ouvrir Insertis ↗
          </a>
        </div>
      </header>

      <section className="sas-grid">
        <article className="sas-card sas-large-card">
          <h2>Zone de dépôt temporaire</h2>
          <p>
            Coller ici uniquement les éléments utiles au travail en cours. Éviter les détails sensibles non nécessaires.
          </p>
          <textarea
            aria-label="Zone de dépôt temporaire Insertis"
            placeholder="Coller ici une note, une information anonymisée ou un brouillon à retravailler..."
          />
        </article>

        <article className="sas-card">
          <h2>Transformer en note courte</h2>
          <ul>
            <li>Situation actuelle utile au parcours RSA</li>
            <li>Démarche réalisée ou proposée</li>
            <li>Prochaine étape claire</li>
            <li>Éviter les détails sensibles inutiles</li>
          </ul>
        </article>

        <article className="sas-card">
          <h2>Créer les étapes</h2>
          <ul>
            <li>Action à faire</li>
            <li>Responsable ou partenaire</li>
            <li>Échéance</li>
            <li>Statut : à faire, en cours, réalisé</li>
          </ul>
        </article>

        <article className="sas-card">
          <h2>Points de vigilance</h2>
          <ul>
            <li>Données de santé : seulement si impact direct</li>
            <li>Famille : uniquement ce qui sécurise le parcours</li>
            <li>Dette / budget : rester factuel</li>
            <li>Insertis reste l’outil officiel de saisie</li>
          </ul>
        </article>
      </section>

      <section className="sas-warning">
        <strong>Règle de sécurité :</strong>
        <span>
          Ce sas ne récupère pas automatiquement les données Insertis. Il sert seulement à préparer ton travail
          avant saisie officielle.
        </span>
      </section>
    </main>
  );
}
