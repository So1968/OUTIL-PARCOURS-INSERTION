import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-accompagnement-global-fiche-minute-test";

const ficheVide = {
  notesBrutes: "",
  faits: "",
  parole: "",
  analyse: "",
  demarches: "",
  vigilance: "",
  suitePrevue: "",
};

function getInitialFiche() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...ficheVide, ...JSON.parse(saved) } : ficheVide;
  } catch {
    return ficheVide;
  }
}

function propre(texte) {
  return String(texte || "").trim();
}

function valeur(texte, remplacement = "À compléter") {
  return propre(texte) || remplacement;
}

function genererTraceCourte(fiche) {
  return [
    "Trace courte — après contact",
    "",
    `Situation abordée : ${valeur(fiche.faits)}.`,
    fiche.parole ? `La personne indique : ${propre(fiche.parole)}.` : "",
    fiche.analyse ? `Lecture professionnelle : ${propre(fiche.analyse)}.` : "",
    fiche.demarches ? `Démarches réalisées : ${propre(fiche.demarches)}.` : "",
    fiche.vigilance ? `Vigilance : ${propre(fiche.vigilance)}.` : "",
    `Suite prévue : ${valeur(fiche.suitePrevue)}.`,
  ].filter(Boolean).join("\n");
}

function genererNoteSociale(fiche) {
  return [
    "Faits / situation abordée",
    valeur(fiche.faits),
    "",
    "Parole de la personne",
    valeur(fiche.parole, "Non renseigné"),
    "",
    "Analyse professionnelle",
    valeur(fiche.analyse, "À compléter si nécessaire"),
    "",
    "Démarches réalisées",
    valeur(fiche.demarches),
    "",
    "Vigilance",
    valeur(fiche.vigilance, "Aucune vigilance particulière renseignée"),
    "",
    "Suite prévue",
    valeur(fiche.suitePrevue),
  ].join("\n");
}

function preparerDepuisNotes(notes) {
  const texte = propre(notes);
  if (!texte) return null;

  return {
    faits: texte,
    parole: "",
    analyse: "Situation à reprendre à partir des éléments notés. Vérifier les informations utiles avant transmission.",
    demarches: "",
    vigilance: "",
    suitePrevue: "",
  };
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#F7F1E8",
    color: "#443E37",
    padding: "22px 18px 52px",
    fontFamily: "Arial, system-ui, sans-serif",
  },
  wrap: { maxWidth: "1040px", margin: "0 auto" },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  brand: { display: "flex", gap: "14px", alignItems: "center" },
  logo: { width: "54px", height: "54px", objectFit: "contain", borderRadius: "12px", background: "white", border: "1px solid #D2C4B3" },
  label: { margin: "0 0 7px", color: "#6F765D", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#334052", fontSize: "28px", lineHeight: 1.08 },
  h2: { margin: "0 0 8px", color: "#334052", fontSize: "20px", lineHeight: 1.18 },
  intro: { margin: "6px 0 0", color: "#5D554B", fontSize: "15px", lineHeight: 1.45 },
  card: { background: "#FBF7EF", border: "1px solid #D2C4B3", borderRadius: "16px", padding: "18px", marginBottom: "14px", boxShadow: "0 6px 14px rgba(63,55,47,0.04)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" },
  field: { display: "grid", gap: "7px", color: "#4B443C", fontWeight: 900, fontSize: "14px" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "12px", padding: "10px 12px", fontSize: "15px", lineHeight: 1.4, background: "#FFFDF8", color: "#443E37", resize: "vertical" },
  small: { color: "#746B60", fontSize: "13px", lineHeight: 1.35, fontWeight: 500 },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px", alignItems: "center" },
  button: { border: "1px solid #D2C4B3", borderRadius: "999px", minHeight: "36px", padding: "8px 13px", background: "#E8DDCC", color: "#334052", fontWeight: 900, cursor: "pointer" },
  mainButton: { border: "1px solid #7F8A69", borderRadius: "999px", minHeight: "36px", padding: "8px 14px", background: "#7F8A69", color: "white", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "36px", padding: "8px 13px", borderRadius: "999px", background: "#E8DDCC", color: "#334052", textDecoration: "none", fontWeight: 900, border: "1px solid #D2C4B3", whiteSpace: "nowrap" },
  message: { margin: 0, color: "#6F765D", fontWeight: 900 },
  helpBox: { background: "#EFE4D2", border: "1px solid #D2C4B3", borderRadius: "14px", padding: "12px", color: "#5D554B", lineHeight: 1.4 },
};

export function TnsFicheMinutePage() {
  const [fiche, setFiche] = useState(getInitialFiche);
  const [message, setMessage] = useState("");
  const traceCourte = useMemo(() => genererTraceCourte(fiche), [fiche]);
  const noteSociale = useMemo(() => genererNoteSociale(fiche), [fiche]);

  function update(field, value) {
    setFiche((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function enregistrer() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fiche));
    setMessage("Fiche conservée dans ce navigateur.");
  }

  function copier(texte, libelle) {
    navigator.clipboard.writeText(texte);
    setMessage(`${libelle} copié.`);
  }

  function vider() {
    localStorage.removeItem(STORAGE_KEY);
    setFiche(ficheVide);
    setMessage("Fiche remise à zéro.");
  }

  function repartirNotes() {
    const proposition = preparerDepuisNotes(fiche.notesBrutes);
    if (!proposition) {
      setMessage("Ajoute d’abord tes notes brutes.");
      return;
    }
    setFiche((current) => ({ ...current, ...proposition }));
    setMessage("Notes brutes placées dans la situation abordée. Tu peux maintenant préciser les rubriques sociales.");
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.top}>
          <div style={s.brand}>
            <img style={s.logo} src="/logo-artag.png" alt="ARTAG" />
            <div>
              <p style={s.label}>Accompagnement global</p>
              <h1 style={s.h1}>Fiche minute après contact</h1>
              <p style={s.intro}>Une page courte : notes brutes, rédaction sociale, puis copie vers Insertis ou Mon Suivi Social.</p>
            </div>
          </div>
          <Link style={s.link} to="/accompagnement-global">Retour</Link>
        </header>

        <section style={s.card}>
          <p style={s.label}>1. Notes rapides</p>
          <h2 style={s.h2}>Je pose ce que j’ai en tête</h2>
          <label style={s.field}>
            Mes notes brutes
            <textarea
              style={{ ...s.textarea, minHeight: "130px" }}
              value={fiche.notesBrutes}
              onChange={(event) => update("notesBrutes", event.target.value)}
              placeholder="Ex. Mme dit qu’elle est perdue avec la CAF, DTR pas faite, peur coupure RSA, projet vente marché à reprendre, vérifier URSSAF..."
            />
            <span style={s.small}>Tu peux écrire vite, sans forme. L’outil ne doit pas inventer : il t’aide surtout à ranger et reformuler.</span>
          </label>
          <div style={s.actions}>
            <button style={s.button} type="button" onClick={repartirNotes}>Préparer depuis mes notes</button>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>2. Rédaction sociale</p>
          <h2 style={s.h2}>Les 6 blocs utiles</h2>
          <p style={s.intro}>Pas de type de contact ni d’objet ici : tu les coches déjà dans les logiciels métier.</p>
          <div style={{ ...s.grid, marginTop: "14px" }}>
            <label style={s.field}>Faits / situation abordée<textarea style={s.textarea} rows="5" value={fiche.faits} onChange={(event) => update("faits", event.target.value)} placeholder="Ce qui est objectivable : courrier, démarche, situation abordée, document, échéance..." /></label>
            <label style={s.field}>Parole de la personne<textarea style={s.textarea} rows="5" value={fiche.parole} onChange={(event) => update("parole", event.target.value)} placeholder="La personne indique..., exprime..., demande..., dit ne pas comprendre..." /></label>
            <label style={s.field}>Analyse professionnelle<textarea style={s.textarea} rows="5" value={fiche.analyse} onChange={(event) => update("analyse", event.target.value)} placeholder="Lecture prudente : ce qui est repéré, à vérifier, à consolider, sans jugement." /></label>
            <label style={s.field}>Démarches réalisées<textarea style={s.textarea} rows="5" value={fiche.demarches} onChange={(event) => update("demarches", event.target.value)} placeholder="Ce qui a été fait pendant ou après le contact." /></label>
            <label style={s.field}>Vigilance<textarea style={s.textarea} rows="4" value={fiche.vigilance} onChange={(event) => update("vigilance", event.target.value)} placeholder="Rupture de droits, dette, délai, blocage, document manquant, santé, logement..." /></label>
            <label style={s.field}>Suite prévue<textarea style={s.textarea} rows="4" value={fiche.suitePrevue} onChange={(event) => update("suitePrevue", event.target.value)} placeholder="Prochaine étape : qui fait quoi, pour quand, avec quel document." /></label>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>3. Textes produits</p>
          <h2 style={s.h2}>Copier-coller propre</h2>
          <div style={s.grid}>
            <label style={s.field}>Version courte Insertis<textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={traceCourte} /></label>
            <label style={s.field}>Version Mon Suivi Social<textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={noteSociale} /></label>
          </div>
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={() => copier(traceCourte, "Version Insertis")}>Copier Insertis</button>
            <button style={s.mainButton} type="button" onClick={() => copier(noteSociale, "Version Mon Suivi Social")}>Copier Mon Suivi Social</button>
            <button style={s.button} type="button" onClick={enregistrer}>Enregistrer localement</button>
            <button style={s.button} type="button" onClick={vider}>Remettre à zéro</button>
            {message && <p style={s.message}>{message}</p>}
          </div>
        </section>

        <section style={s.helpBox}>
          <strong>Posture sociale :</strong> faits observables, parole de la personne, analyse prudente, démarches, vigilance et suite. Le reste peut rester dans les cases des logiciels métier.
        </section>
      </div>
    </main>
  );
}
