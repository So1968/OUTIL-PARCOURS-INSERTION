import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  canauxContact,
  documentsCommunsParMotif,
  motifsRendezVous,
  statutsRendezVous,
  typesRendezVous,
} from "../data/troncCommunSuivi";

const rdvInitial = {
  prenom: "",
  telephone: "",
  canal: "SMS",
  accordRappel: "Oui",
  type: "Rendez-vous social",
  motif: "Premier contact / accueil",
  date: "",
  heure: "",
  lieu: "ARTAG",
  statut: "À confirmer",
};

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

function getDocuments(motif) {
  return documentsCommunsParMotif[motif] || documentsCommunsParMotif["Autre motif à préciser"];
}

function genererRappel(rdv, moment) {
  const civilite = rdv.prenom.trim() ? `Bonjour ${rdv.prenom.trim()},` : "Bonjour,";
  const date = formaterDateRdv(rdv.date);
  const heure = rdv.heure ? ` à ${rdv.heure}` : "";
  const lieu = rdv.lieu.trim() || "ARTAG";
  const documents = getDocuments(rdv.motif).slice(0, moment === "J-7" ? 6 : 4);
  const intro =
    moment === "J-7"
      ? `Rappel : nous avons rendez-vous dans environ une semaine, ${date}${heure} à ${lieu}.`
      : `Petit rappel : notre rendez-vous est prévu dans deux jours, ${date}${heure} à ${lieu}.`;
  const consigne =
    moment === "J-7"
      ? "Cela vous laisse le temps de préparer tranquillement les documents utiles :"
      : "Merci de venir avec les documents que vous avez déjà sous la main :";

  return [
    civilite,
    intro,
    `Objet du rendez-vous : ${rdv.motif}.`,
    consigne,
    ...documents.map((document) => `- ${document}`),
    "Si vous ne les avez pas tous, ce n’est pas grave : venez avec ce que vous avez.",
    "Si vous ne pouvez pas venir, merci de prévenir afin qu’on puisse reproposer un créneau.",
    "ARTAG",
  ].join("\n");
}

export function RendezVousSuiviPage() {
  const [rdv, setRdv] = useState(rdvInitial);
  const [copie, setCopie] = useState("");
  const documents = useMemo(() => getDocuments(rdv.motif), [rdv.motif]);
  const rappelSemaine = useMemo(() => genererRappel(rdv, "J-7"), [rdv]);
  const rappelDeuxJours = useMemo(() => genererRappel(rdv, "J-2"), [rdv]);
  const lienSemaine = useMemo(
    () => creerLienEnvoi(rdv.canal, rdv.telephone, rappelSemaine),
    [rdv.canal, rdv.telephone, rappelSemaine],
  );
  const lienDeuxJours = useMemo(
    () => creerLienEnvoi(rdv.canal, rdv.telephone, rappelDeuxJours),
    [rdv.canal, rdv.telephone, rappelDeuxJours],
  );
  const accordOk = rdv.accordRappel === "Oui";

  function updateRdv(field, value) {
    setRdv((current) => ({ ...current, [field]: value }));
    setCopie("");
  }

  function copier(message, label) {
    navigator.clipboard.writeText(message);
    setCopie(label);
  }

  return (
    <main className="page-shell tns-page rendez-vous-suivi-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Tronc commun</p>
          <h1>Rendez-vous, rappels et documents</h1>
          <p className="page-intro">
            Une brique commune pour tous les accompagnements : social, socio-professionnel,
            Appui TNS, continuité et partenaires.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <h2>Objectif</h2>
        <p>
          Préparer le rendez-vous, rappeler la personne au bon moment, demander les bons documents
          et sortir avec une prochaine action claire.
        </p>
      </section>

      <section className="page-card">
        <h2>Informations du rendez-vous</h2>
        <div className="identity-form-grid">
          <label>
            <span>Type de rendez-vous</span>
            <select value={rdv.type} onChange={(event) => updateRdv("type", event.target.value)}>
              {typesRendezVous.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Motif</span>
            <select value={rdv.motif} onChange={(event) => updateRdv("motif", event.target.value)}>
              {motifsRendezVous.map((motif) => (
                <option key={motif}>{motif}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Statut</span>
            <select value={rdv.statut} onChange={(event) => updateRdv("statut", event.target.value)}>
              {statutsRendezVous.map((statut) => (
                <option key={statut}>{statut}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Prénom</span>
            <input value={rdv.prenom} onChange={(event) => updateRdv("prenom", event.target.value)} />
          </label>

          <label>
            <span>Téléphone</span>
            <input type="tel" value={rdv.telephone} onChange={(event) => updateRdv("telephone", event.target.value)} placeholder="06 00 00 00 00" />
          </label>

          <label>
            <span>Canal préféré</span>
            <select value={rdv.canal} onChange={(event) => updateRdv("canal", event.target.value)}>
              {canauxContact.map((canal) => (
                <option key={canal}>{canal}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Accord pour rappel</span>
            <select value={rdv.accordRappel} onChange={(event) => updateRdv("accordRappel", event.target.value)}>
              <option>Oui</option>
              <option>Non</option>
              <option>À demander</option>
            </select>
          </label>

          <label>
            <span>Date</span>
            <input type="date" value={rdv.date} onChange={(event) => updateRdv("date", event.target.value)} />
          </label>

          <label>
            <span>Heure</span>
            <input type="time" value={rdv.heure} onChange={(event) => updateRdv("heure", event.target.value)} />
          </label>

          <label>
            <span>Lieu</span>
            <input value={rdv.lieu} onChange={(event) => updateRdv("lieu", event.target.value)} />
          </label>
        </div>

        {!accordOk && (
          <p className="validation-message">
            Accord à vérifier avant envoi. Le message peut être préparé, mais ne doit pas être envoyé sans accord.
          </p>
        )}
      </section>

      <section className="page-card">
        <h2>Documents utiles selon le motif</h2>
        <div className="referentiel-domaines-grid dossier-domaines-grid">
          {documents.map((document) => (
            <span key={document}>{document}</span>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Rappels</h2>
        <div className="page-grid">
          <article className="page-card">
            <h3>Rappel J-7</h3>
            <label className="insertis-summary-field">
              <span>Message une semaine avant</span>
              <textarea rows="8" value={rappelSemaine} readOnly />
            </label>
            <div className="identity-actions">
              <button className="primary-button" type="button" onClick={() => copier(rappelSemaine, "Rappel J-7 copié.")}>Copier J-7</button>
              <a className="secondary-button" href={lienSemaine}>Ouvrir {rdv.canal} J-7</a>
            </div>
          </article>

          <article className="page-card">
            <h3>Rappel J-2</h3>
            <label className="insertis-summary-field">
              <span>Message deux jours avant</span>
              <textarea rows="8" value={rappelDeuxJours} readOnly />
            </label>
            <div className="identity-actions">
              <button className="primary-button" type="button" onClick={() => copier(rappelDeuxJours, "Rappel J-2 copié.")}>Copier J-2</button>
              <a className="secondary-button" href={lienDeuxJours}>Ouvrir {rdv.canal} J-2</a>
            </div>
          </article>
        </div>

        {copie && <p className="validation-message">{copie}</p>}
      </section>

      <section className="page-card">
        <h2>Prochaine action</h2>
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
            <span>Échéance</span>
            <input type="date" />
          </label>
        </div>

        <label className="insertis-summary-field">
          <span>Action prévue</span>
          <textarea rows="4" placeholder="Une action claire, une personne responsable, une date, un document attendu." />
        </label>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/parcours-social-socio-professionnel/dossier">
          Retour dossier
        </Link>
        <Link className="secondary-button" to="/appui-tns/analyse">
          Aller au diagnostic TNS
        </Link>
      </div>
    </main>
  );
}
