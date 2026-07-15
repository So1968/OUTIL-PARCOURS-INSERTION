import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-lecture-globale-optimisee-v1";

const DOMAINES = [
  {
    id: "droits",
    titre: "Droits / RSA / CAF",
    question: "DTR, courrier CAF, suspension, radiation, incompréhension des droits.",
    point: "Situation CAF/RSA, déclaration trimestrielle et risque éventuel de rupture de droit à clarifier.",
    vigilance: "Vigilance sur le maintien des droits et les délais de régularisation.",
    action: "Vérifier avec la personne les derniers courriers CAF/RSA, l’état de la DTR et les démarches en attente.",
  },
  {
    id: "administratif",
    titre: "Administratif",
    question: "Courriers, pièces, comptes en ligne, compréhension des demandes.",
    point: "Situation administrative et documents attendus à clarifier.",
    vigilance: "Vigilance sur les courriers non traités ou les démarches en ligne non accessibles.",
    action: "Identifier les documents manquants, les accès utiles et la démarche prioritaire à réaliser.",
  },
  {
    id: "budget",
    titre: "Budget / dettes",
    question: "Impayés, amendes, échéancier, urgence financière.",
    point: "Situation budgétaire, dettes éventuelles et échéances financières à préciser.",
    vigilance: "Vigilance sur le risque d’aggravation financière ou de relance contentieuse.",
    action: "Lister les dettes connues, les échéances proches et les possibilités d’échelonnement ou d’orientation.",
  },
  {
    id: "logement",
    titre: "Logement",
    question: "Stabilité, dette locative, courrier bailleur, hébergement.",
    point: "Situation de logement et stabilité résidentielle à vérifier.",
    vigilance: "Vigilance en cas de dette locative, menace d’expulsion ou hébergement fragile.",
    action: "Vérifier les courriers logement, l’existence d’une dette ou d’un contact bailleur/partenaire.",
  },
  {
    id: "sante",
    titre: "Santé",
    question: "Frein santé, fatigue, soins, MDPH, médecin, capacité à agir.",
    point: "Éléments de santé pouvant impacter les démarches ou l’activité à prendre en compte.",
    vigilance: "Vigilance sur la capacité actuelle de la personne à réaliser seule les démarches attendues.",
    action: "Clarifier les soins en cours, les démarches santé/MDPH éventuelles et les besoins d’appui adaptés.",
  },
  {
    id: "famille",
    titre: "Famille",
    question: "Enfants, scolarité, aidance, séparation, charge familiale.",
    point: "Situation familiale et incidences sur le parcours à préciser.",
    vigilance: "Vigilance si la charge familiale limite la disponibilité ou la capacité de mobilisation.",
    action: "Repérer les contraintes familiales, les appuis existants et les démarches prioritaires liées à la famille.",
  },
  {
    id: "activite",
    titre: "Activité / emploi",
    question: "Projet, micro-entreprise, activité réelle, reprise, fermeture, salariat.",
    point: "Situation professionnelle ou activité indépendante à qualifier.",
    vigilance: "Vigilance sur l’écart entre projet annoncé, activité réelle et obligations administratives.",
    action: "Vérifier le statut de l’activité, les déclarations, les revenus et la prochaine étape professionnelle possible.",
  },
  {
    id: "numerique",
    titre: "Numérique",
    question: "Accès CAF, URSSAF, mail, mot de passe, téléphone, autonomie numérique.",
    point: "Autonomie numérique et accès aux comptes administratifs à évaluer.",
    vigilance: "Vigilance si l’absence d’accès numérique bloque les démarches essentielles.",
    action: "Identifier les comptes à récupérer et prévoir un appui ou une orientation numérique si nécessaire.",
  },
  {
    id: "partenaires",
    titre: "Partenaires",
    question: "CAF, Métropole, MDM, France Services, bailleur, DGFIP, association.",
    point: "Interlocuteurs partenaires et relais déjà mobilisés à identifier.",
    vigilance: "Vigilance si un partenaire attend une réponse ou si les rôles ne sont pas clarifiés.",
    action: "Identifier qui fait quoi et prévoir, si besoin, une relance ou une coordination courte.",
  },
];

const INITIAL = {
  notesBrutes: "",
  faits: "",
  parole: "",
  analyse: "",
  demarches: "",
  vigilance: "",
  suitePrevue: "",
};

function lireSauvegarde() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...INITIAL, ...JSON.parse(saved) } : INITIAL;
  } catch {
    return INITIAL;
  }
}

function ajouterTexte(ancien, ajout) {
  if (!ajout.trim()) return ancien;
  if (!ancien.trim()) return ajout.trim();
  if (ancien.includes(ajout.trim())) return ancien;
  return `${ancien.trim()}\n- ${ajout.trim()}`;
}

function ligne(titre, texte, remplacement = "à compléter") {
  return `${titre}\n${String(texte || "").trim() || remplacement}`;
}

function genererInsertis(form) {
  return [
    "Lecture globale / point d’accompagnement.",
    form.faits ? `Éléments abordés : ${form.faits}` : "Éléments abordés : à compléter.",
    form.parole ? `Parole de la personne : ${form.parole}` : "",
    form.demarches ? `Démarches réalisées : ${form.demarches}` : "",
    form.vigilance ? `Vigilance : ${form.vigilance}` : "",
    form.suitePrevue ? `Suite prévue : ${form.suitePrevue}` : "Suite prévue : à préciser.",
  ].filter(Boolean).join("\n");
}

function genererSuiviSocial(form) {
  return [
    ligne("Faits / situation abordée :", form.faits),
    "",
    ligne("Parole de la personne :", form.parole, "non renseigné"),
    "",
    ligne("Analyse professionnelle :", form.analyse, "à compléter si nécessaire"),
    "",
    ligne("Démarches réalisées :", form.demarches, "à compléter"),
    "",
    ligne("Vigilance :", form.vigilance, "aucune vigilance particulière renseignée"),
    "",
    ligne("Suite prévue :", form.suitePrevue, "à préciser"),
  ].join("\n");
}

const s = {
  page: { minHeight: "100vh", background: "#F7F1E8", color: "#443E37", padding: "22px 18px 56px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1120px", margin: "0 auto" },
  top: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "16px" },
  card: { background: "#FBF7EF", border: "1px solid #D2C4B3", borderRadius: "16px", padding: "18px", marginBottom: "14px", boxShadow: "0 6px 14px rgba(63,55,47,0.04)" },
  smallCard: { background: "#FBF7EF", border: "1px solid #D2C4B3", borderRadius: "14px", padding: "14px" },
  label: { margin: "0 0 6px", color: "#6F765D", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#334052", fontSize: "28px", lineHeight: 1.1 },
  h2: { margin: "0 0 8px", color: "#334052", fontSize: "20px", lineHeight: 1.2 },
  h3: { margin: "0 0 6px", color: "#334052", fontSize: "16px", lineHeight: 1.2 },
  intro: { margin: "6px 0 0", color: "#5D554B", fontSize: "15px", lineHeight: 1.45 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" },
  field: { display: "grid", gap: "6px", fontWeight: 800, color: "#4B443C", fontSize: "14px" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "12px", padding: "10px 12px", fontSize: "14px", lineHeight: 1.4, background: "#FFFDF8", color: "#443E37", minHeight: "92px" },
  bigTextarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "14px", padding: "12px", fontSize: "15px", lineHeight: 1.45, background: "#FFFDF8", color: "#443E37", minHeight: "140px" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" },
  button: { border: "1px solid #D2C4B3", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#E8DDCC", color: "#334052", fontWeight: 900, cursor: "pointer" },
  mainButton: { border: "1px solid #7F8A69", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#7F8A69", color: "white", fontWeight: 900, cursor: "pointer" },
  dangerButton: { border: "1px solid #D2C4B3", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#FBF7EF", color: "#745146", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: "#E8DDCC", color: "#334052", textDecoration: "none", fontWeight: 900, border: "1px solid #D2C4B3" },
  muted: { margin: "5px 0", color: "#6B6258", lineHeight: 1.35, fontSize: "14px" },
  message: { margin: "8px 0 0", color: "#6F765D", fontWeight: 900 },
  chip: { display: "inline-flex", borderRadius: "999px", padding: "4px 9px", background: "#E8DDCC", color: "#5D554B", fontSize: "12px", fontWeight: 900 },
};

export function LectureGlobaleOptimiseePage() {
  const [form, setForm] = useState(lireSauvegarde);
  const [message, setMessage] = useState("");
  const insertis = useMemo(() => genererInsertis(form), [form]);
  const suiviSocial = useMemo(() => genererSuiviSocial(form), [form]);

  function update(champ, valeur) {
    setForm((current) => ({ ...current, [champ]: valeur }));
    setMessage("");
  }

  function sauvegarder(next = form) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setMessage("Lecture globale enregistrée dans ce navigateur.");
  }

  function repartirDesNotes() {
    if (!form.notesBrutes.trim()) {
      setMessage("Ajoute d’abord tes notes brutes.");
      return;
    }
    const next = { ...form, faits: ajouterTexte(form.faits, form.notesBrutes) };
    setForm(next);
    sauvegarder(next);
    setMessage("Notes brutes ajoutées aux éléments de situation. Tu peux ensuite répartir dans les 6 blocs.");
  }

  function ajouterRepere(domaine) {
    const next = {
      ...form,
      faits: ajouterTexte(form.faits, `Point à clarifier : ${domaine.point}`),
      vigilance: ajouterTexte(form.vigilance, domaine.vigilance),
      suitePrevue: ajouterTexte(form.suitePrevue, domaine.action),
    };
    setForm(next);
    sauvegarder(next);
    setMessage(`${domaine.titre} ajouté à la note et à la prochaine action.`);
  }

  function copier(texte, libelle) {
    navigator.clipboard.writeText(texte);
    setMessage(`${libelle} copié.`);
  }

  function vider() {
    localStorage.removeItem(STORAGE_KEY);
    setForm(INITIAL);
    setMessage("Lecture globale remise à zéro.");
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.top}>
          <div>
            <p style={s.label}>Lecture globale optimisée</p>
            <h1 style={s.h1}>Transformer une lecture de dossier en action utile</h1>
            <p style={s.intro}>Les repères rapides ne sont plus un questionnaire : ce sont des raccourcis pour produire une note, une vigilance et une suite claire.</p>
          </div>
          <Link style={s.link} to="/accompagnement-global">Retour</Link>
        </header>

        <section style={s.card}>
          <p style={s.label}>1. Départ rapide</p>
          <h2 style={s.h2}>Mes notes brutes</h2>
          <p style={s.intro}>Écris comme ça vient. L’outil n’invente pas : il t’aide ensuite à ranger et à formuler.</p>
          <textarea
            style={{ ...s.bigTextarea, marginTop: "12px" }}
            value={form.notesBrutes}
            onChange={(event) => update("notesBrutes", event.target.value)}
            placeholder="Ex. Mme dit être perdue avec la CAF, DTR non faite, peur d’une suspension. Projet de reprise marché mais statut micro-entreprise à vérifier."
          />
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={repartirDesNotes}>Préparer depuis mes notes</button>
            <button style={s.button} type="button" onClick={() => sauvegarder()}>Enregistrer</button>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>2. Repères rapides utiles</p>
          <h2 style={s.h2}>Clique seulement si le domaine compte vraiment</h2>
          <p style={s.intro}>Chaque repère ajoute automatiquement : un point à clarifier, une vigilance possible et une suite prévue. Tu peux modifier ensuite.</p>
          <div style={{ ...s.grid3, marginTop: "12px" }}>
            {DOMAINES.map((domaine) => (
              <article style={s.smallCard} key={domaine.id}>
                <span style={s.chip}>Repère</span>
                <h3 style={{ ...s.h3, marginTop: "10px" }}>{domaine.titre}</h3>
                <p style={s.muted}>{domaine.question}</p>
                <button style={s.button} type="button" onClick={() => ajouterRepere(domaine)}>Ajouter à ma lecture</button>
              </article>
            ))}
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>3. Note sociale structurée</p>
          <h2 style={s.h2}>Les 6 blocs qui servent vraiment</h2>
          <div style={s.grid2}>
            <label style={s.field}>Faits / situation abordée<textarea style={s.textarea} value={form.faits} onChange={(event) => update("faits", event.target.value)} /></label>
            <label style={s.field}>Parole de la personne<textarea style={s.textarea} value={form.parole} onChange={(event) => update("parole", event.target.value)} /></label>
            <label style={s.field}>Analyse professionnelle<textarea style={s.textarea} value={form.analyse} onChange={(event) => update("analyse", event.target.value)} /></label>
            <label style={s.field}>Démarches réalisées<textarea style={s.textarea} value={form.demarches} onChange={(event) => update("demarches", event.target.value)} /></label>
            <label style={s.field}>Vigilance<textarea style={s.textarea} value={form.vigilance} onChange={(event) => update("vigilance", event.target.value)} /></label>
            <label style={s.field}>Suite prévue<textarea style={s.textarea} value={form.suitePrevue} onChange={(event) => update("suitePrevue", event.target.value)} /></label>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>4. Sorties prêtes à copier</p>
          <h2 style={s.h2}>Insertis + Mon Suivi Social</h2>
          <div style={s.grid2}>
            <label style={s.field}>Trace courte Insertis<textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={insertis} /></label>
            <label style={s.field}>Note Mon Suivi Social<textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={suiviSocial} /></label>
          </div>
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={() => copier(insertis, "Trace Insertis")}>Copier Insertis</button>
            <button style={s.mainButton} type="button" onClick={() => copier(suiviSocial, "Note Mon Suivi Social")}>Copier Mon Suivi Social</button>
            <button style={s.button} type="button" onClick={() => sauvegarder()}>Enregistrer</button>
            <button style={s.dangerButton} type="button" onClick={vider}>Remettre à zéro</button>
            {message && <p style={s.message}>{message}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
