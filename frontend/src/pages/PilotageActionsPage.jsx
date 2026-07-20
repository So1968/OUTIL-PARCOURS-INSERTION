import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const STORAGE_ROWS = "artag-pilotage-actions-rows-v1";
const STORAGE_ACTIONS = "artag-pilotage-actions-suivi-v1";

function lireJson(cle, defaut) {
  try {
    const valeur = localStorage.getItem(cle);
    return valeur ? JSON.parse(valeur) : defaut;
  } catch {
    return defaut;
  }
}

function detecterSeparateur(ligne) {
  const candidats = [";", ",", "\t"];
  return candidats
    .map((separateur) => ({ separateur, score: ligne.split(separateur).length }))
    .sort((a, b) => b.score - a.score)[0].separateur;
}

function parserCsv(texte) {
  const premiereLigne = String(texte || "").split(/\r?\n/).find((ligne) => ligne.trim()) || "";
  const separateur = detecterSeparateur(premiereLigne);
  const lignes = [];
  let ligne = [];
  let valeur = "";
  let guillemets = false;

  for (let i = 0; i < texte.length; i += 1) {
    const caractere = texte[i];
    const suivant = texte[i + 1];

    if (caractere === '"' && guillemets && suivant === '"') {
      valeur += '"';
      i += 1;
    } else if (caractere === '"') {
      guillemets = !guillemets;
    } else if (caractere === separateur && !guillemets) {
      ligne.push(valeur);
      valeur = "";
    } else if ((caractere === "\n" || caractere === "\r") && !guillemets) {
      if (caractere === "\r" && suivant === "\n") i += 1;
      ligne.push(valeur);
      if (ligne.some((cellule) => cellule.trim())) lignes.push(ligne);
      ligne = [];
      valeur = "";
    } else {
      valeur += caractere;
    }
  }

  ligne.push(valeur);
  if (ligne.some((cellule) => cellule.trim())) lignes.push(ligne);
  if (lignes.length < 2) return [];

  const entetes = lignes[0].map((entete) => entete.trim().replace(/^\uFEFF/, ""));

  return lignes.slice(1).map((cellules) => {
    const item = {};
    entetes.forEach((entete, index) => {
      item[entete] = String(cellules[index] || "").trim();
    });
    return item;
  });
}

function valeur(row, noms) {
  for (const nom of noms) {
    if (row[nom]) return row[nom];
  }
  return "";
}

function normaliser(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function dateIsoDans(nbJours) {
  const date = new Date();
  date.setDate(date.getDate() + nbJours);
  return date.toISOString().slice(0, 10);
}

function joursAvant(dateIso) {
  if (!dateIso) return 999;
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const cible = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(cible.getTime())) return 999;
  return Math.round((cible.getTime() - debut.getTime()) / 86400000);
}

function idDossier(row, index) {
  return valeur(row, ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier"]) || row.__id || `dossier-${index}`;
}

function prenom(row) {
  return String(row.Prénom || row.Prenom || row.PrenomUsuel || "").trim();
}

function nom(row) {
  return String(row.Nom || "").trim();
}

function affichageDossier(row, toutesLesLignes) {
  const p = prenom(row);
  const n = nom(row);

  if (!p && !n) return "Dossier";
  if (!p) return n.slice(0, 3);

  const doublons = toutesLesLignes.filter((item) => prenom(item).toLowerCase() === p.toLowerCase()).length;
  return doublons > 1 && n ? `${p} ${n.slice(0, 3)}` : p;
}

function actionVide() {
  return {
    priorite: "À qualifier",
    prochaineAction: "",
    echeance: "",
    vigilance: "À suivre",
    statut: "À faire",
    traceInsertis: "À prévoir",
    note: "",
  };
}

function tachesTypes(row) {
  const type = normaliser(valeur(row, ["Type d'accompagnement", "Type d’accompagnement", "Accompagnement"]));
  const intensite = normaliser(valeur(row, ["Intensité", "Intensite"]));
  const base = [
    "Appeler la personne",
    "Envoyer un SMS de rappel",
    "Prévoir / confirmer un rendez-vous",
    "Relancer les justificatifs",
    "Faire une trace Insertis",
  ];

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("itineraire")) {
    base.push(
      "Faire un point activité / micro-entreprise",
      "Vérifier les déclarations CAF / RSA / DTR",
      "Vérifier statut, CA et démarches en cours",
      "Préparer une orientation création / activité",
    );
  } else {
    base.push(
      "Qualifier la situation globale",
      "Évaluer l’autonomie administrative",
      "Identifier les freins principaux",
      "Préparer une orientation partenaire",
    );
  }

  if (intensite.includes("renforce") || intensite.includes("intensif")) {
    base.unshift("Reprendre rapidement le dossier");
  }

  base.push("Reporter / mettre en attente", "Autre action à préciser");
  return [...new Set(base)];
}

function propositionAutomatique(row) {
  const type = normaliser(valeur(row, ["Type d'accompagnement", "Type d’accompagnement", "Accompagnement"]));
  const intensite = normaliser(valeur(row, ["Intensité", "Intensite"]));
  const ville = valeur(row, ["Ville", "Commune"]);
  const telephone = valeur(row, ["Téléphone mobile", "Telephone mobile", "Téléphone fixe", "Telephone fixe"]);
  const email = valeur(row, ["Email", "Mail", "Courriel"]);

  let priorite = "Priorité 3";
  let vigilance = "À suivre";
  let echeance = dateIsoDans(14);

  if (intensite.includes("renforce") || intensite.includes("intensif")) {
    priorite = "Priorité 2";
    vigilance = "Importante";
    echeance = dateIsoDans(7);
  }

  const actions = [];

  if (!telephone && !email) {
    actions.push("- Vérifier les coordonnées de contact");
    priorite = "Priorité 2";
    vigilance = "Importante";
    echeance = dateIsoDans(7);
  }

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("itineraire")) {
    actions.push("- Faire un point activité / statut / démarches en cours");
    actions.push("- Vérifier les déclarations utiles CAF / RSA / activité");
    actions.push("- Identifier la prochaine étape réaliste du projet ou de l’activité");
  } else {
    actions.push("- Qualifier la situation globale");
    actions.push("- Identifier les freins principaux et le niveau d’autonomie");
    actions.push("- Prévoir ou confirmer un rendez-vous");
  }

  actions.push("- Faire une trace Insertis après qualification");
  if (ville) actions.push(`- Vérifier si un relais local est utile sur ${ville}`);

  return {
    priorite,
    prochaineAction: actions.join("\n"),
    echeance,
    vigilance,
    statut: "À faire",
    traceInsertis: "À prévoir",
    note: "Prérempli automatiquement à partir de l’export Insertis. À ajuster après lecture du dossier.",
  };
}

function dejaTravaille(action) {
  if (!action) return false;
  const base = actionVide();
  return (
    Boolean(action.prochaineAction) ||
    Boolean(action.echeance) ||
    Boolean(action.note) ||
    action.priorite !== base.priorite ||
    action.vigilance !== base.vigilance ||
    action.statut !== base.statut ||
    action.traceInsertis !== base.traceInsertis
  );
}

function niveauPriorite(action) {
  let score = 0;
  if (action.vigilance === "Urgente") score += 100;
  if (action.vigilance === "Importante") score += 70;
  if (action.priorite === "Priorité 1") score += 90;
  if (action.priorite === "Priorité 2") score += 60;
  if (action.priorite === "Priorité 3") score += 30;
  if (action.statut === "À faire") score += 25;
  if (action.statut === "En cours") score += 15;
  if (["À faire", "À prévoir"].includes(action.traceInsertis)) score += 8;

  const jours = joursAvant(action.echeance);
  if (jours < 0) score += 90;
  else if (jours === 0) score += 80;
  else if (jours <= 2) score += 65;
  else if (jours <= 7) score += 35;
  else if (jours <= 14) score += 12;

  return score;
}

function libelleDelai(echeance) {
  const jours = joursAvant(echeance);
  if (!echeance) return "Sans échéance";
  if (jours < 0) return `En retard de ${Math.abs(jours)} j`;
  if (jours === 0) return "Aujourd’hui";
  if (jours === 1) return "Demain";
  if (jours <= 7) return `Dans ${jours} j`;
  return echeance;
}

function premierElementAction(texte) {
  const ligne = String(texte || "")
    .split(/\n+/)
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .find(Boolean);
  return ligne || "Action à préciser";
}

function categoriePilotage(action) {
  const jours = joursAvant(action.echeance);
  if (action.statut === "Fait" || action.statut === "Reporté") return "Archive";
  if (action.vigilance === "Urgente" || action.priorite === "Priorité 1" || jours <= 0) return "À faire maintenant";
  if (action.vigilance === "Importante" || action.priorite === "Priorité 2" || jours <= 7) return "Cette semaine";
  return "À suivre";
}

function synthese(rows, actions) {
  const lignes = ["Pilotage actions — file active Insertis", "", `Nombre de dossiers : ${rows.length}`, ""];

  rows.forEach((row, index) => {
    const id = idDossier(row, index);
    const action = { ...actionVide(), ...(actions[id] || {}) };

    lignes.push(`${affichageDossier(row, rows)} — ${valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "sans numéro"}`);
    lignes.push(`- Ville : ${valeur(row, ["Ville", "Commune"]) || "à préciser"} / CLI : ${row.CLI || "à préciser"}`);
    lignes.push(`- Priorité : ${action.priorite}`);
    lignes.push(`- Échéance : ${action.echeance || "à préciser"} / Vigilance : ${action.vigilance}`);
    lignes.push(`- Statut : ${action.statut} / Trace Insertis : ${action.traceInsertis}`);
    lignes.push(`- Action utile : ${premierElementAction(action.prochaineAction)}`);
    if (action.note) lignes.push(`- Note : ${action.note}`);
    lignes.push("");
  });

  return lignes.join("\n");
}

const s = {
  page: { minHeight: "100vh", background: "#111827", color: "#E5E7EB", padding: "24px 22px 56px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1380px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "18px" },
  label: { margin: "0 0 6px", color: "#A7F3D0", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#F9FAFB", fontSize: "30px", lineHeight: 1.1 },
  h2: { margin: "0 0 10px", color: "#F9FAFB", fontSize: "20px", lineHeight: 1.2 },
  intro: { margin: "8px 0 0", color: "#CBD5E1", fontSize: "15px", lineHeight: 1.45, maxWidth: "920px" },
  card: { background: "#1F2937", border: "1px solid #374151", borderRadius: "18px", padding: "18px", marginBottom: "14px", boxShadow: "0 10px 24px rgba(0,0,0,0.24)" },
  board: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" },
  kpi: { background: "#111827", border: "1px solid #374151", borderRadius: "16px", padding: "13px", color: "#E5E7EB" },
  kpiActif: { outline: "3px solid #34D399" },
  kpiNumber: { margin: 0, fontSize: "25px", fontWeight: 900, color: "#F9FAFB" },
  kpiLabel: { margin: "4px 0 0", fontSize: "12px", color: "#CBD5E1", fontWeight: 800 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #4B5563", borderRadius: "10px", padding: "8px 10px", fontSize: "14px", background: "#0F172A", color: "#F9FAFB" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #4B5563", borderRadius: "10px", padding: "8px 10px", fontSize: "14px", lineHeight: 1.35, background: "#0F172A", color: "#F9FAFB", minHeight: "76px" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" },
  button: { border: "1px solid #4B5563", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#111827", color: "#E5E7EB", fontWeight: 800, cursor: "pointer" },
  mainButton: { border: "1px solid #10B981", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#10B981", color: "#062015", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "32px", padding: "7px 12px", borderRadius: "999px", background: "#0F172A", color: "#A7F3D0", textDecoration: "none", fontWeight: 900, border: "1px solid #374151", marginTop: "8px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 9px" },
  th: { textAlign: "left", fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px" },
  td: { background: "#111827", borderTop: "1px solid #374151", borderBottom: "1px solid #374151", padding: "9px 8px", verticalAlign: "top", fontSize: "13px", color: "#E5E7EB" },
  tdFirst: { background: "#111827", borderTop: "1px solid #374151", borderBottom: "1px solid #374151", borderLeft: "1px solid #374151", borderTopLeftRadius: "14px", borderBottomLeftRadius: "14px", padding: "9px 8px", verticalAlign: "top", fontSize: "13px", minWidth: "160px", color: "#E5E7EB" },
  tdLast: { background: "#111827", borderTop: "1px solid #374151", borderBottom: "1px solid #374151", borderRight: "1px solid #374151", borderTopRightRadius: "14px", borderBottomRightRadius: "14px", padding: "9px 8px", verticalAlign: "top", fontSize: "13px", minWidth: "140px", color: "#E5E7EB" },
  small: { display: "block", color: "#94A3B8", fontSize: "12px", lineHeight: 1.35, marginTop: "4px" },
  message: { color: "#A7F3D0", fontWeight: 900 },
  badge: { display: "inline-flex", alignItems: "center", borderRadius: "999px", padding: "4px 8px", fontSize: "11px", fontWeight: 900, background: "#064E3B", color: "#A7F3D0", marginRight: "6px", marginBottom: "5px" },
  urgent: { background: "#7F1D1D", color: "#FECACA" },
  important: { background: "#78350F", color: "#FDE68A" },
  follow: { background: "#1E3A8A", color: "#BFDBFE" },
};

function libelleFiltre(filtre) {
  if (filtre === "Actions") return "Actions à faire";
  if (filtre === "Urgentes") return "Vigilences urgentes";
  if (filtre === "Importantes") return "Vigilances importantes";
  if (filtre === "Traces") return "Traces Insertis à faire ou à prévoir";
  return "Tous les dossiers";
}

function Badge({ children, type }) {
  const style = type === "urgent" ? s.urgent : type === "important" ? s.important : type === "follow" ? s.follow : {};
  return <span style={{ ...s.badge, ...style }}>{children}</span>;
}

export function PilotageActionsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [actions, setActions] = useState(() => lireJson(STORAGE_ACTIONS, {}));
  const [recherche, setRecherche] = useState("");
  const [filtreVigilance, setFiltreVigilance] = useState("Toutes");
  const [filtreRapide, setFiltreRapide] = useState("Tous");
  const [message, setMessage] = useState("");

  const entrees = useMemo(
    () => rows.map((row, index) => ({ row, index, id: idDossier(row, index), action: { ...actionVide(), ...(actions[idDossier(row, index)] || {}) } })),
    [rows, actions],
  );

  const entreesTriees = useMemo(
    () => [...entrees].sort((a, b) => niveauPriorite(b.action) - niveauPriorite(a.action)),
    [entrees],
  );

  const entreesFiltrees = useMemo(() => {
    return entreesTriees.filter(({ row, action }) => {
      const texte = `${affichageDossier(row, rows)} ${valeur(row, ["Numéro Insertis", "Numero Insertis"])} ${row.Ville || ""} ${row.CLI || ""}`.toLowerCase();
      const okRecherche = texte.includes(recherche.toLowerCase());
      const okVigilance = filtreVigilance === "Toutes" || action.vigilance === filtreVigilance;
      const okRapide =
        filtreRapide === "Tous" ||
        (filtreRapide === "Actions" && action.statut === "À faire") ||
        (filtreRapide === "Urgentes" && action.vigilance === "Urgente") ||
        (filtreRapide === "Importantes" && action.vigilance === "Importante") ||
        (filtreRapide === "Traces" && ["À faire", "À prévoir"].includes(action.traceInsertis));

      return okRecherche && okVigilance && okRapide;
    });
  }, [entreesTriees, rows, recherche, filtreVigilance, filtreRapide]);

  const groupes = useMemo(() => {
    const base = {
      "À faire maintenant": [],
      "Cette semaine": [],
      "À suivre": [],
    };
    entreesTriees.forEach((entree) => {
      const categorie = categoriePilotage(entree.action);
      if (base[categorie]) base[categorie].push(entree);
    });
    return base;
  }, [entreesTriees]);

  const kpis = useMemo(() => {
    const valeurs = entrees.map((entree) => entree.action);
    return {
      total: entrees.length,
      maintenant: groupes["À faire maintenant"].length,
      semaine: groupes["Cette semaine"].length,
      aFaire: valeurs.filter((action) => action.statut === "À faire").length,
      insertis: valeurs.filter((action) => ["À faire", "À prévoir"].includes(action.traceInsertis)).length,
    };
  }, [entrees, groupes]);

  const texteSynthese = useMemo(() => synthese(rows, actions), [rows, actions]);

  function enregistrer(nextActions) {
    setActions(nextActions);
    localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(nextActions));
  }

  function enregistrerRows(nextRows, nextActions = actions) {
    setRows(nextRows);
    setActions(nextActions);
    localStorage.setItem(STORAGE_ROWS, JSON.stringify(nextRows));
    localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(nextActions));
  }

  function importerCsv(event) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lignes = parserCsv(String(reader.result || ""));
      if (!lignes.length) {
        setMessage("Le fichier n’a pas été reconnu comme CSV exploitable. Essayer un export CSV Insertis.");
        return;
      }

      const nextActions = {};
      lignes.forEach((row, index) => {
        const id = idDossier(row, index);
        const existante = { ...actionVide(), ...(actions[id] || {}) };
        nextActions[id] = dejaTravaille(existante) ? existante : { ...actionVide(), ...propositionAutomatique(row) };
      });

      enregistrerRows(lignes, nextActions);
      setMessage(`${lignes.length} dossiers importés. Les priorités sont visibles tout de suite ci-dessous.`);
    };

    reader.readAsText(fichier, "windows-1252");
  }

  function creerDossierManuel() {
    const p = window.prompt("Prénom ou repère du dossier ?", "Dossier test");
    if (p === null) return;
    const id = `manuel-${Date.now()}`;
    const row = {
      __id: id,
      Prénom: p.trim() || "Dossier test",
      Nom: "",
      "Numéro Insertis": id,
      Ville: "",
      CLI: "",
      CTM: "",
      "Type d’accompagnement": "Accompagnement global",
      Intensité: "À qualifier",
    };
    const nextRows = [row, ...rows];
    const nextActions = { ...actions, [id]: { ...actionVide(), prochaineAction: "- Qualifier la situation globale", echeance: dateIsoDans(7), priorite: "Priorité 2", vigilance: "À suivre" } };
    enregistrerRows(nextRows, nextActions);
    setMessage("Dossier manuel créé.");
    navigate(`/pilotage-actions/dossier/${encodeURIComponent(id)}`);
  }

  function updateAction(id, champ, valeurAction) {
    const next = {
      ...actions,
      [id]: {
        ...actionVide(),
        ...(actions[id] || {}),
        [champ]: valeurAction,
      },
    };
    enregistrer(next);
    setMessage("Modification enregistrée.");
  }

  function ajouterTache(id, tache) {
    if (!tache) return;
    const actionActuelle = { ...actionVide(), ...(actions[id] || {}) };
    const ancienne = actionActuelle.prochaineAction || "";
    const nouvelle = ancienne.trim() ? `${ancienne.trim()}\n- ${tache}` : `- ${tache}`;
    updateAction(id, "prochaineAction", nouvelle);
  }

  function marquerFait(id) {
    const actuelle = { ...actionVide(), ...(actions[id] || {}) };
    updateAction(id, "statut", actuelle.statut === "Fait" ? "À faire" : "Fait");
  }

  function automatiserLignesVides() {
    if (!rows.length) {
      setMessage("Importer un CSV ou créer un dossier manuel avant d’automatiser.");
      return;
    }
    const next = { ...actions };
    rows.forEach((row, index) => {
      const id = idDossier(row, index);
      const actuelle = { ...actionVide(), ...(next[id] || {}) };
      if (!dejaTravaille(actuelle) || !actuelle.prochaineAction) next[id] = { ...actuelle, ...propositionAutomatique(row) };
    });
    enregistrer(next);
    setMessage("Les lignes vides ont été préremplies automatiquement.");
  }

  function recalculerTouteLaFile() {
    if (!rows.length) {
      setMessage("Importer un CSV ou créer un dossier manuel avant de recalculer.");
      return;
    }
    if (!window.confirm("Recalculer toute la file va remplacer les priorités, actions et vigilances actuelles. Continuer ?")) return;
    const next = {};
    rows.forEach((row, index) => {
      next[idDossier(row, index)] = { ...actionVide(), ...propositionAutomatique(row) };
    });
    enregistrer(next);
    setMessage("Toute la file a été recalculée automatiquement.");
  }

  function copierSynthese() {
    navigator.clipboard.writeText(texteSynthese);
    setMessage("Synthèse copiée.");
  }

  function telechargerSynthese() {
    const blob = new Blob([texteSynthese], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `pilotage_actions_insertis_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
    setMessage("Synthèse téléchargée.");
  }

  function effacerLocal() {
    if (!window.confirm("Effacer la liste importée et le suivi local ?")) return;
    localStorage.removeItem(STORAGE_ROWS);
    localStorage.removeItem(STORAGE_ACTIONS);
    setRows([]);
    setActions({});
    setMessage("Données locales effacées.");
  }

  function CarteAction({ entree }) {
    const { row, id, action } = entree;
    const categorie = categoriePilotage(action);
    const badgeType = categorie === "À faire maintenant" ? "urgent" : categorie === "Cette semaine" ? "important" : "follow";

    return (
      <article style={{ ...s.kpi, padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
          <div>
            <strong style={{ fontSize: "16px", color: "#F9FAFB" }}>{affichageDossier(row, rows)}</strong>
            <span style={s.small}>{valeur(row, ["Ville", "Commune"]) || "Ville ?"} · {row.CLI || "CLI ?"}</span>
          </div>
          <Badge type={badgeType}>{libelleDelai(action.echeance)}</Badge>
        </div>
        <div style={{ marginTop: "10px" }}>
          <Badge type={action.vigilance === "Urgente" ? "urgent" : action.vigilance === "Importante" ? "important" : "follow"}>{action.vigilance}</Badge>
          <Badge>{action.priorite}</Badge>
          <Badge>{action.statut}</Badge>
        </div>
        <p style={{ margin: "10px 0 0", color: "#E5E7EB", lineHeight: 1.35, fontWeight: 800 }}>
          {premierElementAction(action.prochaineAction)}
        </p>
        <div style={s.actions}>
          <Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(id)}`}>Ouvrir</Link>
          <button type="button" style={s.button} onClick={() => marquerFait(id)}>{action.statut === "Fait" ? "Remettre à faire" : "Marquer fait"}</button>
        </div>
      </article>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.header}>
          <div>
            <p style={s.label}>Poste de pilotage</p>
            <h1 style={s.h1}>Ce qui est à faire</h1>
            <p style={s.intro}>
              Vue priorisée de la file active : l’action utile, l’échéance, la vigilance et l’accès au dossier sont visibles sans ouvrir chaque fiche.
            </p>
          </div>
        </header>

        <section style={s.card}>
          <div style={s.grid}>
            <label>
              <span style={s.small}>Importer le CSV Insertis</span>
              <input style={s.input} type="file" accept=".csv,text/csv" onChange={importerCsv} />
            </label>
            <label>
              <span style={s.small}>Action automatique</span>
              <select
                style={s.input}
                value=""
                onChange={(event) => {
                  if (event.target.value === "vides") automatiserLignesVides();
                  if (event.target.value === "tout") recalculerTouteLaFile();
                  event.target.value = "";
                }}
              >
                <option value="">Choisir...</option>
                <option value="vides">Préremplir les lignes vides</option>
                <option value="tout">Recalculer toute la file active</option>
              </select>
            </label>
            <div>
              <span style={s.small}>Sans CSV / test</span>
              <button type="button" style={s.mainButton} onClick={creerDossierManuel}>Créer un dossier manuel</button>
            </div>
          </div>
          <p style={{ margin: "10px 0 0", color: "#94A3B8", fontSize: "13px" }}>
            Les données restent dans ce navigateur. Ne pas pousser les exports usagers sur GitHub.
          </p>
          {message && <p style={s.message}>{message}</p>}
        </section>

        {rows.length === 0 ? (
          <section style={s.card}>
            <h2 style={s.h2}>Pour démarrer</h2>
            <p style={s.intro}>Importer la file active Insertis en CSV ou créer un dossier manuel de test. Dès qu’un dossier existe, les priorités apparaissent ici.</p>
          </section>
        ) : (
          <>
            <section style={s.grid}>
              {[
                ["Tous", kpis.total, "Dossiers"],
                ["Urgentes", kpis.maintenant, "À faire maintenant"],
                ["Importantes", kpis.semaine, "Cette semaine"],
                ["Actions", kpis.aFaire, "Actions à faire"],
                ["Traces", kpis.insertis, "Traces Insertis"],
              ].map(([filtre, nombre, libelle]) => (
                <button
                  type="button"
                  key={filtre}
                  style={{ ...s.kpi, ...(filtreRapide === filtre ? s.kpiActif : {}), textAlign: "left", cursor: "pointer" }}
                  onClick={() => setFiltreRapide(filtre)}
                >
                  <p style={s.kpiNumber}>{nombre}</p>
                  <p style={s.kpiLabel}>{libelle}</p>
                </button>
              ))}
            </section>

            <section style={s.board}>
              {Object.entries(groupes).map(([titre, liste]) => (
                <div key={titre} style={s.card}>
                  <h2 style={s.h2}>{titre}</h2>
                  {liste.length ? liste.slice(0, 5).map((entree) => <CarteAction key={entree.id} entree={entree} />) : <p style={s.intro}>Rien dans cette catégorie.</p>}
                </div>
              ))}
            </section>

            <section style={s.card}>
              <div style={s.grid}>
                <label>
                  <span style={s.small}>Recherche prénom / ville / numéro</span>
                  <input style={s.input} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Taper un prénom, une ville, un numéro..." />
                </label>
                <label>
                  <span style={s.small}>Filtre vigilance</span>
                  <select style={s.input} value={filtreVigilance} onChange={(event) => setFiltreVigilance(event.target.value)}>
                    <option>Toutes</option>
                    <option>Faible</option>
                    <option>À suivre</option>
                    <option>Importante</option>
                    <option>Urgente</option>
                  </select>
                </label>
              </div>
              {filtreRapide !== "Tous" && (
                <p style={s.intro}>Affichage en cours : <strong>{libelleFiltre(filtreRapide)}</strong>. <button type="button" style={s.button} onClick={() => setFiltreRapide("Tous")}>Tout afficher</button></p>
              )}
            </section>

            <section style={s.card}>
              <h2 style={s.h2}>File active priorisée</h2>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Dossier</th>
                      <th style={s.th}>À faire</th>
                      <th style={s.th}>Échéance</th>
                      <th style={s.th}>Priorité</th>
                      <th style={s.th}>Vigilance</th>
                      <th style={s.th}>Statut</th>
                      <th style={s.th}>Trace</th>
                      <th style={s.th}>Accès</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entreesFiltrees.map(({ row, id, action }) => (
                      <tr key={id}>
                        <td style={s.tdFirst}>
                          <strong>{affichageDossier(row, rows)}</strong>
                          <span style={s.small}>{valeur(row, ["Numéro Insertis", "Numero Insertis"])}</span>
                          <span style={s.small}>{valeur(row, ["Ville", "Commune"]) || "Ville ?"} · {row.CLI || "CLI ?"}</span>
                        </td>
                        <td style={s.td}>
                          <textarea style={s.textarea} value={action.prochaineAction} onChange={(event) => updateAction(id, "prochaineAction", event.target.value)} />
                          <select style={{ ...s.input, marginTop: "8px" }} value="" onChange={(event) => { ajouterTache(id, event.target.value); event.target.value = ""; }}>
                            <option value="">Ajouter une tâche...</option>
                            {tachesTypes(row).map((tache) => <option key={tache} value={tache}>{tache}</option>)}
                          </select>
                        </td>
                        <td style={s.td}>
                          <strong>{libelleDelai(action.echeance)}</strong>
                          <input style={{ ...s.input, marginTop: "8px" }} type="date" value={action.echeance} onChange={(event) => updateAction(id, "echeance", event.target.value)} />
                        </td>
                        <td style={s.td}>
                          <select style={s.input} value={action.priorite} onChange={(event) => updateAction(id, "priorite", event.target.value)}>
                            <option>À qualifier</option>
                            <option>Priorité 1</option>
                            <option>Priorité 2</option>
                            <option>Priorité 3</option>
                            <option>À reporter</option>
                          </select>
                        </td>
                        <td style={s.td}>
                          <select style={s.input} value={action.vigilance} onChange={(event) => updateAction(id, "vigilance", event.target.value)}>
                            <option>Faible</option>
                            <option>À suivre</option>
                            <option>Importante</option>
                            <option>Urgente</option>
                          </select>
                        </td>
                        <td style={s.td}>
                          <select style={s.input} value={action.statut} onChange={(event) => updateAction(id, "statut", event.target.value)}>
                            <option>À faire</option>
                            <option>En cours</option>
                            <option>En attente</option>
                            <option>Fait</option>
                            <option>Reporté</option>
                          </select>
                        </td>
                        <td style={s.td}>
                          <select style={s.input} value={action.traceInsertis} onChange={(event) => updateAction(id, "traceInsertis", event.target.value)}>
                            <option>À prévoir</option>
                            <option>À faire</option>
                            <option>Faite</option>
                            <option>Pas nécessaire</option>
                          </select>
                        </td>
                        <td style={s.tdLast}>
                          <Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(id)}`}>Ouvrir dossier</Link>
                          <button type="button" style={{ ...s.button, marginTop: "8px" }} onClick={() => marquerFait(id)}>{action.statut === "Fait" ? "À refaire" : "Fait"}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={s.actions}>
                <button style={s.mainButton} type="button" onClick={copierSynthese}>Copier synthèse</button>
                <button style={s.button} type="button" onClick={telechargerSynthese}>Télécharger synthèse</button>
                <button style={s.button} type="button" onClick={effacerLocal}>Effacer données locales</button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
