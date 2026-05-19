import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  demarchesCreationEntreprise,
  documentsTnsTousTypes,
} from "../data/tnsCreationEntreprise";

const champsDiagnostic = [
  {
    id: "etatBoite",
    label: "État de la boîte",
    aide: "Où en est l’activité aujourd’hui ?",
    options: [
      "À clarifier",
      "En idée / envie de créer",
      "Création en cours",
      "Créée et active",
      "Créée mais peu active",
      "En pause / sommeil",
      "À régulariser",
      "À fermer / radiation à envisager",
      "Activité non déclarée",
    ],
  },
  {
    id: "statut",
    label: "Statut connu",
    aide: "Ce que la personne sait déjà du cadre administratif.",
    options: [
      "À vérifier",
      "Micro-entreprise",
      "Entreprise individuelle",
      "Société",
      "Conjoint collaborateur / aide familiale",
      "Pas encore créée",
      "Statut inconnu",
    ],
  },
  {
    id: "activiteReelle",
    label: "Activité réelle",
    aide: "Est-ce qu’il se passe quelque chose concrètement ?",
    options: [
      "À préciser",
      "Pas encore démarré",
      "Quelques clients / chantiers ponctuels",
      "Activité irrégulière",
      "Activité régulière",
      "Activité arrêtée",
      "Activité difficile à prouver",
    ],
  },
  {
    id: "revenus",
    label: "Chiffre d’affaires / revenus",
    aide: "Niveau de visibilité sur l’argent généré par la boîte.",
    options: [
      "Inconnu / à retrouver",
      "Aucun chiffre d’affaires",
      "Très irrégulier",
      "Régulier mais faible",
      "Régulier et significatif",
      "Déclaré mais à vérifier",
      "Non déclaré / risque à clarifier",
    ],
  },
  {
    id: "administratif",
    label: "Situation administrative",
    aide: "URSSAF, impôts, CAF/RSA, courriers, échéances.",
    options: [
      "À vérifier",
      "Semble à jour",
      "Déclarations en retard",
      "Dette ou échéance urgente",
      "Courrier incompris",
      "Compte bloqué / accès perdu",
      "Risque de rupture de droits",
    ],
  },
  {
    id: "besoin",
    label: "Besoin principal",
    aide: "Ce qui doit être traité en premier.",
    options: [
      "Comprendre la situation",
      "Créer l’activité",
      "Régulariser",
      "Déclarer / mettre à jour",
      "Comprendre les droits RSA / CAF",
      "Relancer l’activité",
      "Arrêter / fermer proprement",
      "Orienter vers un partenaire",
    ],
  },
];

const valeurInitiale = champsDiagnostic.reduce((acc, champ) => {
  acc[champ.id] = champ.options[0];
  return acc;
}, {});

const rdvInitial = {
  prenom: "",
  telephone: "",
  canal: "SMS",
  accordRappel: "Oui",
  date: "",
  heure: "",
  lieu: "ARTAG",
};

function trouverScenario(reponses) {
  const valeurs = Object.values(reponses);
  const scenarios = demarchesCreationEntreprise.scenarios;

  if (valeurs.some((valeur) => scenarios.creation.declencheurs.includes(valeur))) {
    return scenarios.creation;
  }

  if (valeurs.some((valeur) => scenarios.regularisation.declencheurs.includes(valeur))) {
    return scenarios.regularisation;
  }

  if (valeurs.some((valeur) => scenarios.fermeture.declencheurs.includes(valeur))) {
    return scenarios.fermeture;
  }

  return null;
}

function documentsPourTexto(scenario) {
  if (scenario?.documents?.length) {
    return scenario.documents.slice(0, 8);
  }

  return documentsTnsTousTypes
    .flatMap((groupe) => groupe.items)
    .slice(0, 8);
}

function genererTexto(scenario) {
  const documents = documentsPourTexto(scenario);

  return [
    "Bonjour, pour notre rendez-vous Appui TNS / création d’entreprise, merci d’apporter si possible :",
    ...documents.map((document) => `- ${document}`),
    "Si vous ne les avez pas tous, ce n’est pas grave : venez avec ce que vous avez. Nous ferons le point ensemble.",
    "ARTAG",
  ].join("\n");
}

function formaterDateRdv(date) {
  if (!date) {
    return "la date prévue";
  }

  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return date;
  }
}

function genererRappelRdv(rdv, scenario) {
  const civilite = rdv.prenom.trim() ? `Bonjour ${rdv.prenom.trim()},` : "Bonjour,";
  const date = formaterDateRdv(rdv.date);
  const heure = rdv.heure ? ` à ${rdv.heure}` : "";
  const lieu = rdv.lieu.trim() || "ARTAG";
  const documents = documentsPourTexto(scenario).slice(0, 5);

  return [
    civilite,
    `Petit rappel : nous avons rendez-vous ${date}${heure} à ${lieu} pour faire le point sur votre projet / activité indépendante.`,
    "Merci de venir avec les documents que vous avez, même si le dossier n’est pas complet :",
    ...documents.map((document) => `- ${document}`),
    "Si vous ne pouvez pas venir, merci de prévenir afin qu’on puisse reproposer un créneau.",
    "ARTAG",
  ].join("\n");
}

function normaliserNumeroSms(numero) {
  return numero.replace(/[^\d+]/g, "");
}

function normaliserNumeroWhatsapp(numero) {
  const chiffres = numero.replace(/\D/g, "");

  if (chiffres.startsWith("0")) {
    return `33${chiffres.slice(1)}`;
  }

  return chiffres;
}

function creerLienSms(numero, message) {
  const telephone = normaliserNumeroSms(numero);
  const body = encodeURIComponent(message);

  return telephone ? `sms:${telephone}?&body=${body}` : `sms:?&body=${body}`;
}

function creerLienWhatsapp(numero, message) {
  const telephone = normaliserNumeroWhatsapp(numero);
  const texte = encodeURIComponent(message);

  return telephone ? `https://wa.me/${telephone}?text=${texte}` : `https://wa.me/?text=${texte}`;
}

function creerLienEnvoi(canal, numero, message) {
  if (canal === "WhatsApp") {
    return creerLienWhatsapp(numero, message);
  }

  return creerLienSms(numero, message);
}

export function TnsAnalysePage() {
  const [reponses, setReponses] = useState(valeurInitiale);
  const [rdv, setRdv] = useState(rdvInitial);
  const [textoCopie, setTextoCopie] = useState(false);
  const [rappelCopie, setRappelCopie] = useState(false);
  const scenario = useMemo(() => trouverScenario(reponses), [reponses]);
  const texto = useMemo(() => genererTexto(scenario), [scenario]);
  const rappelRdv = useMemo(() => genererRappelRdv(rdv, scenario), [rdv, scenario]);
  const lienRappel = useMemo(
    () => creerLienEnvoi(rdv.canal, rdv.telephone, rappelRdv),
    [rdv.canal, rdv.telephone, rappelRdv],
  );
  const lienDocuments = useMemo(
    () => creerLienEnvoi(rdv.canal, rdv.telephone, texto),
    [rdv.canal, rdv.telephone, texto],
  );
  const accordOk = rdv.accordRappel === "Oui";

  function updateReponse(id, value) {
    setReponses((current) => ({ ...current, [id]: value }));
    setTextoCopie(false);
    setRappelCopie(false);
  }

  function updateRdv(field, value) {
    setRdv((current) => ({ ...current, [field]: value }));
    setRappelCopie(false);
  }

  function copierTexto() {
    navigator.clipboard.writeText(texto);
    setTextoCopie(true);
  }

  function copierRappel() {
    navigator.clipboard.writeText(rappelRdv);
    setRappelCopie(true);
  }

  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Diagnostic TNS — où en est la boîte ?</h1>
          <p className="page-intro">
            Une grille courte pour le premier rendez-vous : tu coches la situation,
            l’outil fait apparaître les démarches, documents, liens utiles, un texto documents et un rappel de rendez-vous.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Premier rendez-vous</p>
        <h2>On qualifie avant de conseiller</h2>
        <p>
          Le but est de comprendre l’état réel de l’activité : créée ou non,
          active ou non, à jour ou non, viable ou en difficulté.
        </p>
      </section>

      <section className="page-card">
        <h2>Réponses possibles</h2>
        <div className="identity-form-grid tns-select-grid">
          {champsDiagnostic.map((champ) => (
            <label key={champ.id}>
              <span>{champ.label}</span>
              <small>{champ.aide}</small>
              <select
                value={reponses[champ.id]}
                onChange={(event) => updateReponse(champ.id, event.target.value)}
              >
                {champ.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {scenario ? (
        <section className="page-card tns-focus-card">
          <p className="referentiel-label">Démarches proposées</p>
          <h2>{scenario.titre}</h2>
          <p>{scenario.objectif}</p>

          <div className="page-grid">
            <article className="page-card">
              <h3>Démarches à prévoir</h3>
              <ul>
                {scenario.demarches.map((demarche) => (
                  <li key={demarche}>{demarche}</li>
                ))}
              </ul>
            </article>

            <article className="page-card">
              <h3>Documents à demander</h3>
              <ul>
                {scenario.documents.map((document) => (
                  <li key={document}>{document}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="page-card">
            <h3>Points de vigilance</h3>
            <ul>
              {scenario.vigilance.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <article className="page-card">
            <h3>Prochaine action suggérée</h3>
            <p>{scenario.prochaineActionModele}</p>
          </article>
        </section>
      ) : (
        <section className="page-card">
          <h2>À ce stade</h2>
          <p>
            Choisis d’abord l’état de la boîte ou le besoin principal. Les démarches
            adaptées apparaîtront ensuite automatiquement.
          </p>
        </section>
      )}

      <section className="page-card">
        <h2>Coordonnées et accord d’envoi</h2>
        <p className="section-help">
          Pour V1, l’outil ouvre le SMS ou WhatsApp sur le téléphone pro avec le message prérempli. L’envoi reste volontaire : tu relis et tu appuies sur envoyer.
        </p>

        <div className="identity-form-grid">
          <label>
            <span>Téléphone</span>
            <input
              type="tel"
              value={rdv.telephone}
              onChange={(event) => updateRdv("telephone", event.target.value)}
              placeholder="06 00 00 00 00"
            />
          </label>

          <label>
            <span>Canal préféré</span>
            <select value={rdv.canal} onChange={(event) => updateRdv("canal", event.target.value)}>
              <option>SMS</option>
              <option>WhatsApp</option>
            </select>
          </label>

          <label>
            <span>Accord pour rappel</span>
            <select
              value={rdv.accordRappel}
              onChange={(event) => updateRdv("accordRappel", event.target.value)}
            >
              <option>Oui</option>
              <option>Non</option>
              <option>À demander</option>
            </select>
          </label>
        </div>

        {!accordOk && (
          <p className="validation-message">
            Accord à vérifier avant envoi. Tu peux préparer le message, mais il ne doit pas être envoyé sans accord.
          </p>
        )}
      </section>

      <section className="page-card">
        <h2>Rappel de rendez-vous</h2>
        <p className="section-help">
          Comme les rendez-vous manqués sont un vrai point de fragilité, cette zone prépare un message de rappel court à envoyer par SMS ou WhatsApp.
        </p>

        <div className="identity-form-grid">
          <label>
            <span>Prénom</span>
            <input
              type="text"
              value={rdv.prenom}
              onChange={(event) => updateRdv("prenom", event.target.value)}
              placeholder="Prénom si utile"
            />
          </label>

          <label>
            <span>Date du rendez-vous</span>
            <input
              type="date"
              value={rdv.date}
              onChange={(event) => updateRdv("date", event.target.value)}
            />
          </label>

          <label>
            <span>Heure</span>
            <input
              type="time"
              value={rdv.heure}
              onChange={(event) => updateRdv("heure", event.target.value)}
            />
          </label>

          <label>
            <span>Lieu</span>
            <input
              type="text"
              value={rdv.lieu}
              onChange={(event) => updateRdv("lieu", event.target.value)}
              placeholder="ARTAG, téléphone, domicile, autre..."
            />
          </label>
        </div>

        <label className="insertis-summary-field">
          <span>Message de rappel prêt à copier</span>
          <textarea rows="8" value={rappelRdv} readOnly />
        </label>

        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={copierRappel}>
            Copier le rappel RDV
          </button>
          <a className="secondary-button" href={lienRappel}>
            Ouvrir {rdv.canal} rappel RDV
          </a>
          {rappelCopie && <p className="validation-message">Rappel copié.</p>}
        </div>
      </section>

      <section className="page-card">
        <h2>Texto documents à envoyer</h2>
        <p className="section-help">
          Le message ci-dessous s’adapte à la situation cochée. Tu peux le copier puis l’envoyer par SMS, WhatsApp ou mail.
        </p>
        <label className="insertis-summary-field">
          <span>Message prêt à copier</span>
          <textarea rows="9" value={texto} readOnly />
        </label>
        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={copierTexto}>
            Copier le texto documents
          </button>
          <a className="secondary-button" href={lienDocuments}>
            Ouvrir {rdv.canal} documents
          </a>
          {textoCopie && <p className="validation-message">Texto copié.</p>}
        </div>
      </section>

      <section className="page-card">
        <h2>Liens officiels utiles</h2>
        <div className="dossier-modules-list">
          {demarchesCreationEntreprise.liensOfficiels.map((lien) => (
            <article className="dossier-module-item" key={lien.url}>
              <div>
                <strong>{lien.libelle}</strong>
                <span>Site officiel</span>
              </div>
              <p>{lien.usage}</p>
              <a className="secondary-button" href={lien.url} target="_blank" rel="noreferrer">
                Ouvrir le lien
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Documents tous types</h2>
        <p className="section-help">
          Cette liste sert de pense-bête. On ne demande pas tout : on choisit seulement
          les documents utiles selon la situation.
        </p>
        <div className="page-grid">
          {documentsTnsTousTypes.map((groupe) => (
            <article className="page-card" key={groupe.categorie}>
              <h3>{groupe.categorie}</h3>
              <ul>
                {groupe.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Note courte du rendez-vous</h2>
        <label className="insertis-summary-field">
          <span>Ce qu’on retient</span>
          <textarea
            rows="5"
            placeholder="Ex. Projet de création en micro-entreprise. Activité à préciser. Documents demandés par texto. Prochaine action : revenir avec pièce d’identité, justificatif d’adresse et description de l’activité."
          />
        </label>
      </section>

      <section className="page-card">
        <h2>Prochaine action concrète</h2>
        <div className="identity-form-grid">
          <label>
            <span>Responsable</span>
            <select defaultValue="À définir">
              <option>À définir</option>
              <option>Personne accompagnée</option>
              <option>Référente parcours</option>
              <option>Appui TNS</option>
              <option>Partenaire externe</option>
            </select>
          </label>
          <label>
            <span>Date ou échéance</span>
            <input type="date" />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Action prévue</span>
          <textarea
            rows="4"
            placeholder="Une action claire : document à apporter, déclaration à vérifier, appel à faire, rendez-vous à programmer..."
          />
        </label>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/appui-tns">
          Retour Appui TNS
        </Link>
        <Link className="secondary-button" to="/appui-tns/coordination">
          Passer à la coordination
        </Link>
      </div>
    </main>
  );
}
