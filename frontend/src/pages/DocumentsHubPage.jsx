import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readStorageJson, writeStorageJson } from "../lib/storage";
import { documentDossierId, documentPersonLabel, findAutomaticDocumentMatch } from "../lib/documentMatching";
import { buildFolderInventory, duplicateStats, humanFileSize, suggestedTriage } from "../lib/documentInventory";

const STORAGE_KEY = "artag-hub-documentaire-v1";
const ROOTS_KEY = "artag-hub-documentaire-racines-v1";
const ROWS_KEY = "artag-pilotage-actions-rows-v1";

const emptyDocument = {
  libelle: "",
  personne: "",
  categorie: "Dossier personne",
  chemin: "",
  statut: "Actif",
  note: "",
};

const emptyRoots = {
  travail: "",
  tns: "",
  archives: "",
};

function safeText(value) {
  return String(value || "").trim();
}

function createId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDocuments() {
  const value = readStorageJson(STORAGE_KEY, []);
  return Array.isArray(value) ? value : [];
}

function getRoots() {
  return { ...emptyRoots, ...readStorageJson(ROOTS_KEY, {}) };
}

function explorerCommand(path) {
  const clean = safeText(path).replace(/"/g, '""');
  return clean ? `explorer.exe "${clean}"` : "";
}

const s = {
  page: { minHeight: "100vh", background: "#F7F1E8", color: "#443E37", padding: "22px 18px 52px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1180px", margin: "0 auto" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "18px" },
  brand: { display: "flex", gap: "14px", alignItems: "center" },
  logo: { width: "54px", height: "54px", objectFit: "contain", borderRadius: "12px", background: "white", border: "1px solid #D2C4B3" },
  label: { margin: "0 0 7px", color: "#6F765D", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#334052", fontSize: "28px", lineHeight: 1.08 },
  h2: { margin: "0 0 8px", color: "#334052", fontSize: "20px", lineHeight: 1.18 },
  h3: { margin: "0 0 6px", color: "#334052", fontSize: "16px", lineHeight: 1.2 },
  intro: { margin: "6px 0 0", color: "#5D554B", fontSize: "15px", lineHeight: 1.45 },
  card: { background: "#FBF7EF", border: "1px solid #D2C4B3", borderRadius: "16px", padding: "18px", marginBottom: "14px", boxShadow: "0 6px 14px rgba(63,55,47,0.04)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" },
  field: { display: "grid", gap: "6px", color: "#4B443C", fontWeight: 900, fontSize: "13px" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "10px", padding: "9px 10px", fontSize: "14px", background: "#FFFDF8", color: "#443E37" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "10px", padding: "9px 10px", fontSize: "14px", lineHeight: 1.4, background: "#FFFDF8", color: "#443E37", minHeight: "76px", resize: "vertical" },
  actions: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", alignItems: "center" },
  button: { border: "1px solid #D2C4B3", borderRadius: "999px", minHeight: "34px", padding: "7px 11px", background: "#E8DDCC", color: "#334052", fontWeight: 900, cursor: "pointer" },
  mainButton: { border: "1px solid #7F8A69", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#7F8A69", color: "white", fontWeight: 900, cursor: "pointer" },
  dangerButton: { border: "1px solid #B78C7B", borderRadius: "999px", minHeight: "34px", padding: "7px 11px", background: "#F4E5DF", color: "#7D4938", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 11px", borderRadius: "999px", background: "#E8DDCC", color: "#334052", textDecoration: "none", fontWeight: 900, border: "1px solid #D2C4B3", whiteSpace: "nowrap" },
  small: { color: "#746B60", fontSize: "12px", lineHeight: 1.4, fontWeight: 500 },
  notice: { background: "#EFE4D2", border: "1px solid #D2C4B3", borderRadius: "14px", padding: "12px", color: "#5D554B", lineHeight: 1.45 },
  item: { border: "1px solid #D2C4B3", borderRadius: "14px", padding: "13px", background: "#FFFDF8" },
  path: { margin: "6px 0 0", fontFamily: "Consolas, monospace", fontSize: "12px", overflowWrap: "anywhere", color: "#5D554B" },
  badge: { display: "inline-flex", borderRadius: "999px", padding: "4px 8px", background: "#E8DDCC", fontSize: "11px", fontWeight: 900, color: "#334052", marginRight: "6px" },
  count: { fontSize: "28px", fontWeight: 900, color: "#334052", margin: 0 },
};

export function DocumentsHubPage() {
  const [documents, setDocuments] = useState(getDocuments);
  const [rows] = useState(() => {
    const value = readStorageJson(ROWS_KEY, []);
    return Array.isArray(value) ? value : [];
  });
  const [roots, setRoots] = useState(getRoots);
  const [draft, setDraft] = useState(emptyDocument);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [linkFilter, setLinkFilter] = useState("Tous");
  const [triageFilter, setTriageFilter] = useState("Tous");
  const [message, setMessage] = useState("");
  const [lastImport, setLastImport] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return documents
      .filter((doc) => statusFilter === "Tous" || doc.statut === statusFilter)
      .filter((doc) => {
        if (linkFilter === "Liés" && !doc.dossierId) return false;
        if (linkFilter === "À rapprocher" && (doc.dossierId || doc.categorie !== "Dossier personne")) return false;
        if (linkFilter === "Hors dossiers personnes" && doc.categorie === "Dossier personne") return false;
        return true;
      })
      .filter((doc) => {
        if (triageFilter === "Tous") return true;
        const decisions = doc.fileTriage || {};
        return (doc.indexedFiles || []).some((file) => {
          const key = file.relativePath || file.chemin || file.name;
          const decision = decisions[key] || suggestedTriage(file);
          return decision === triageFilter;
        });
      })
      .filter((doc) => {
        if (!q) return true;
        const fileNames = (doc.indexedFiles || []).map((file) => file.name).join(" ");
        return `${doc.libelle} ${doc.personne} ${doc.categorie} ${doc.chemin} ${doc.note} ${fileNames}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => String(a.personne || a.libelle).localeCompare(String(b.personne || b.libelle)));
  }, [documents, query, statusFilter, linkFilter, triageFilter]);

  const documentStats = useMemo(() => ({
    total: documents.length,
    lies: documents.filter((doc) => Boolean(doc.dossierId)).length,
    aRapprocher: documents.filter((doc) => doc.categorie === "Dossier personne" && !doc.dossierId).length,
    fichiers: documents.reduce((sum, doc) => sum + Number(doc.fileCount || 0), 0),
    doublons: documents.reduce((sum, doc) => sum + Number(doc.duplicateFiles || 0), 0),
    aDecider: documents.reduce((sum, doc) => {
      const decisions = doc.fileTriage || {};
      return sum + (doc.indexedFiles || []).filter((file) => {
        const key = file.relativePath || file.chemin || file.name;
        return (decisions[key] || suggestedTriage(file)) === "À décider";
      }).length;
    }, 0),
  }), [documents]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function saveDocuments(next) {
    setDocuments(next);
    writeStorageJson(STORAGE_KEY, next);
  }

  function addDocument(event) {
    event.preventDefault();
    if (!safeText(draft.libelle) || !safeText(draft.chemin)) {
      setMessage("Renseigne au minimum un libellé et un chemin.");
      return;
    }

    const next = [
      ...documents,
      {
        ...draft,
        id: createId(),
        libelle: safeText(draft.libelle),
        personne: safeText(draft.personne),
        chemin: safeText(draft.chemin),
        note: safeText(draft.note),
      },
    ];
    saveDocuments(next);
    setDraft(emptyDocument);
    setMessage("Emplacement documentaire ajouté.");
  }

  function removeDocument(id) {
    saveDocuments(documents.filter((doc) => doc.id !== id));
    setMessage("Référence retirée de l’index. Aucun fichier Windows n’a été supprimé.");
  }

  function updateStatus(id, statut) {
    saveDocuments(documents.map((doc) => (doc.id === id ? { ...doc, statut } : doc)));
  }

  function updateFileTriage(documentId, file, decision) {
    const key = file.relativePath || file.chemin || file.name;
    saveDocuments(documents.map((doc) => {
      if (doc.id !== documentId) return doc;
      return {
        ...doc,
        fileTriage: {
          ...(doc.fileTriage || {}),
          [key]: decision,
        },
      };
    }));
    setMessage("Décision de classement enregistrée. Aucun fichier n’a été déplacé ni supprimé.");
  }

  function updateDocumentDossier(id, dossierId) {
    const rowIndex = rows.findIndex((row, index) => documentDossierId(row, index) === dossierId);
    const selectedRow = rowIndex >= 0 ? rows[rowIndex] : null;

    saveDocuments(documents.map((doc) => {
      if (doc.id !== id) return doc;
      if (!selectedRow) {
        return {
          ...doc,
          dossierId: "",
          matchConfidence: "",
        };
      }

      const personne = documentPersonLabel(selectedRow);
      return {
        ...doc,
        dossierId,
        personne,
        matchConfidence: "manuel",
        note: safeText(doc.note).includes("Rapprochement")
          ? doc.note
          : `${safeText(doc.note)}${safeText(doc.note) ? " " : ""}Rapprochement manuel avec la file active.`,
      };
    }));

    setMessage(selectedRow ? "Référence reliée au dossier de la file active." : "Rattachement retiré.");
  }

  function saveRoots() {
    writeStorageJson(ROOTS_KEY, roots);
    setMessage("Racines de travail enregistrées dans ce navigateur.");
  }

  function reconcileExistingIndex() {
    if (!rows.length) {
      setMessage("La file active est vide : importe d’abord la liste Insertis dans le pilotage.");
      return;
    }

    let matched = 0;
    const next = documents.map((doc) => {
      if (doc.dossierId || doc.categorie !== "Dossier personne") return doc;

      const source = [doc.personne, doc.libelle, doc.chemin?.split(/[\\/]/).pop()].filter(Boolean).join(" ");
      const match = findAutomaticDocumentMatch(source, rows);
      if (!match) return doc;

      matched += 1;
      return {
        ...doc,
        dossierId: match.dossierId,
        personne: match.personne,
        matchConfidence: match.confidence,
        note: safeText(doc.note).includes("Rapprochement automatique")
          ? doc.note
          : `${safeText(doc.note)}${safeText(doc.note) ? " " : ""}Rapprochement automatique avec la file active : ${match.personne}.`,
      };
    });

    if (!matched) {
      setMessage("Aucun rapprochement automatique supplémentaire n’a été trouvé. Les cas restants sont à vérifier manuellement.");
      return;
    }

    saveDocuments(next);
    setMessage(`${matched} référence(s) supplémentaire(s) rapprochée(s) automatiquement avec la file active.`);
  }

  function importExistingFolder(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const relativePaths = files
      .map((file) => file.webkitRelativePath || file.name)
      .filter(Boolean);

    const rootName = relativePaths[0]?.split("/")[0] || "Dossier importé";
    const groups = new Map();

    files.forEach((file) => {
      const relative = file.webkitRelativePath || file.name;
      const parts = relative.split("/").filter(Boolean);
      const groupName = parts.length > 2 ? parts[1] : rootName;
      const item = groups.get(groupName) || { files: [], totalSize: 0 };
      item.files.push(file);
      item.totalSize += Number(file.size || 0);
      groups.set(groupName, item);
    });

    const globalDuplicates = duplicateStats(files);

    const baseRoot = safeText(roots.tns || roots.travail);
    const existingPaths = new Set(
      documents.map((doc) => safeText(doc.chemin).toLowerCase()).filter(Boolean)
    );

    const imported = [];
    groups.forEach((group, groupName) => {
      const chemin = baseRoot
        ? `${baseRoot.replace(/[\\/]$/, "")}\\${groupName}`
        : `${rootName}\\${groupName}`;

      if (existingPaths.has(chemin.toLowerCase())) return;

      const isRootGroup = groupName === rootName;
      const inventory = buildFolderInventory(files, rootName, groupName, baseRoot, 80);
      const groupDuplicates = duplicateStats(group.files);
      const match = isRootGroup ? null : findAutomaticDocumentMatch(groupName, rows);
      const personne = match?.personne || groupName;
      const matchNote = match
        ? ` Rapprochement automatique avec la file active : ${match.personne}.`
        : isRootGroup
          ? " Éléments présents à la racine du dossier sélectionné."
          : " À rapprocher d’un dossier de la file active si nécessaire.";

      imported.push({
        id: createId(),
        dossierId: match?.dossierId || "",
        libelle: isRootGroup ? `Racine ${rootName}` : `Dossier ${personne}`,
        personne: isRootGroup ? "" : personne,
        categorie: isRootGroup ? "Administratif" : "Dossier personne",
        chemin,
        statut: "Actif",
        note: `Import initial : ${inventory.fileCount} fichier(s) repéré(s). Aucun fichier n’a été téléversé.${matchNote}`,
        importSource: rootName,
        fileCount: inventory.fileCount,
        indexedFileCount: inventory.indexedFileCount,
        indexedFiles: inventory.indexedFiles,
        extensionCounts: inventory.extensionCounts,
        latestModified: inventory.latestModified,
        inventoryTruncated: inventory.truncated,
        totalSize: group.totalSize,
        duplicateGroups: groupDuplicates.duplicateGroups,
        duplicateFiles: groupDuplicates.duplicateFiles,
        matchConfidence: match?.confidence || "",
      });
    });

    if (!imported.length) {
      setMessage("Aucun nouveau dossier à ajouter : les références semblent déjà présentes.");
      event.target.value = "";
      return;
    }

    saveDocuments([...documents, ...imported]);
    const matchedCount = imported.filter((doc) => doc.dossierId).length;
    setLastImport({
      rootName,
      folderCount: imported.length,
      fileCount: files.length,
      matchedCount,
      unmatchedCount: imported.filter((doc) => doc.categorie === "Dossier personne" && !doc.dossierId).length,
      duplicateGroups: globalDuplicates.duplicateGroups,
      duplicateFiles: globalDuplicates.duplicateFiles,
    });
    setMessage(`${imported.length} référence(s) intégrée(s), dont ${matchedCount} rapprochée(s) automatiquement avec la file active. ${globalDuplicates.duplicateGroups} groupe(s) de doublons potentiels repéré(s). Les fichiers restent à leur emplacement d’origine.`);
    event.target.value = "";
  }

  async function copyText(value, label) {
    if (!value) {
      setMessage("Aucun chemin à copier.");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copié.`);
    } catch {
      setMessage("Copie impossible depuis ce navigateur.");
    }
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.top}>
          <div style={s.brand}>
            <img style={s.logo} src="/logo-artag.png" alt="ARTAG" />
            <div>
              <p style={s.label}>Accompagnement global · documents</p>
              <h1 style={s.h1}>Hub documentaire</h1>
              <p style={s.intro}>Un index simple pour retrouver les bons dossiers sans déplacer les fichiers ni créer de doublons.</p>
            </div>
          </div>
          <Link style={s.link} to="/accompagnement-global">Retour</Link>
        </header>

        <section style={s.notice}>
          <strong>Principe de sécurité :</strong> ce module ne téléverse pas les documents et ne les stocke pas dans GitHub.
          Il mémorise seulement leurs chemins dans ce navigateur. Les fichiers restent dans Windows / OneDrive, avec leurs droits habituels.
        </section>

        <section style={{ ...s.card, marginTop: "14px" }}>
          <p style={s.label}>1. Racines de travail</p>
          <h2 style={s.h2}>Mes emplacements de référence</h2>
          <div style={s.grid}>
            <label style={s.field}>
              Travail ARTAG
              <input style={s.input} value={roots.travail} onChange={(e) => setRoots((r) => ({ ...r, travail: e.target.value }))} placeholder="Ex. C:\...\OneDrive - ARTAG\Documents\00_TRAVAIL" />
            </label>
            <label style={s.field}>
              Dossiers TNS / préparation RDV
              <input style={s.input} value={roots.tns} onChange={(e) => setRoots((r) => ({ ...r, tns: e.target.value }))} placeholder="Ex. C:\...\01_PERSONNES_PREPARATION_RV" />
            </label>
            <label style={s.field}>
              Archives
              <input style={s.input} value={roots.archives} onChange={(e) => setRoots((r) => ({ ...r, archives: e.target.value }))} placeholder="Chemin vers l’archive de référence" />
            </label>
          </div>
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={saveRoots}>Enregistrer les racines</button>
            {roots.travail && <button style={s.button} type="button" onClick={() => copyText(explorerCommand(roots.travail), "Commande Explorer")}>Copier commande Travail</button>}
            {roots.tns && <button style={s.button} type="button" onClick={() => copyText(explorerCommand(roots.tns), "Commande Explorer")}>Copier commande TNS</button>}
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>2. Importer l’existant</p>
          <h2 style={s.h2}>Mettre une première organisation dans la boucle</h2>
          <p style={s.intro}>
            Sélectionne le dossier qui contient déjà tes sous-dossiers et tes documents. Le navigateur lit uniquement la structure
            et crée des références dans l’index : rien n’est déplacé, supprimé ni envoyé dans GitHub.
          </p>
          <div style={s.actions}>
            <label style={{ ...s.mainButton, display: "inline-flex", alignItems: "center" }}>
              Choisir le dossier existant
              <input
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                onChange={importExistingFolder}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <p style={{ ...s.small, marginTop: "10px" }}>
            Pour obtenir des chemins Windows complets, renseigne d’abord la racine « Dossiers TNS / préparation RDV » ou « Travail ARTAG » ci-dessus.
          </p>
          <div style={s.actions}>
            <button style={s.button} type="button" onClick={reconcileExistingIndex}>Rapprocher l’index avec la file active</button>
          </div>
          {lastImport && (
            <div style={{ ...s.notice, marginTop: "12px" }}>
              <strong>Dernier import :</strong> {lastImport.rootName} — {lastImport.folderCount} référence(s), {lastImport.fileCount} fichier(s), {lastImport.matchedCount} rapprochement(s), {lastImport.unmatchedCount} à vérifier, {lastImport.duplicateGroups} groupe(s) de doublons potentiels.
            </div>
          )}
        </section>

        <section style={s.card}>
          <p style={s.label}>3. Ajouter une référence</p>
          <h2 style={s.h2}>Relier un dossier ou document à l’accompagnement</h2>
          <form onSubmit={addDocument}>
            <div style={s.grid}>
              <label style={s.field}>Libellé<input style={s.input} value={draft.libelle} onChange={(e) => updateDraft("libelle", e.target.value)} placeholder="Ex. Dossier EXEMPLE Alpha" /></label>
              <label style={s.field}>Personne / dossier<input style={s.input} value={draft.personne} onChange={(e) => updateDraft("personne", e.target.value)} placeholder="Nom Prénom ou intitulé d’action" /></label>
              <label style={s.field}>
                Catégorie
                <select style={s.input} value={draft.categorie} onChange={(e) => updateDraft("categorie", e.target.value)}>
                  <option>Dossier personne</option>
                  <option>Atelier</option>
                  <option>Outil / modèle</option>
                  <option>Réunion / équipe</option>
                  <option>Administratif</option>
                  <option>Archive</option>
                  <option>Autre</option>
                </select>
              </label>
              <label style={s.field}>
                Statut
                <select style={s.input} value={draft.statut} onChange={(e) => updateDraft("statut", e.target.value)}>
                  <option>Actif</option>
                  <option>À classer</option>
                  <option>Clos</option>
                  <option>Archivé</option>
                </select>
              </label>
            </div>
            <label style={{ ...s.field, marginTop: "12px" }}>Chemin Windows / OneDrive<input style={s.input} value={draft.chemin} onChange={(e) => updateDraft("chemin", e.target.value)} placeholder="C:\...\dossier ou fichier" /></label>
            <label style={{ ...s.field, marginTop: "12px" }}>Note<textarea style={s.textarea} value={draft.note} onChange={(e) => updateDraft("note", e.target.value)} placeholder="Ce qu’on trouve ici, prochaine action, document à ne pas oublier..." /></label>
            <div style={s.actions}>
              <button style={s.mainButton} type="submit">Ajouter à l’index</button>
            </div>
          </form>
        </section>

        <section style={s.card}>
          <p style={s.label}>4. File de rangement assistée</p>
          <h2 style={s.h2}>Décider sans déplacer ni supprimer automatiquement</h2>
          <p style={s.intro}>
            Chaque fichier indexé peut être marqué « À garder ici », « À déplacer », « À archiver » ou « Doublon à vérifier ».
            Tant qu’aucune décision n’est prise, il reste « À décider ».
          </p>
          <div style={s.actions}>
            {["À décider", "À garder ici", "À déplacer", "À archiver", "Doublon à vérifier"].map((decision) => (
              <button
                key={decision}
                type="button"
                style={triageFilter === decision ? s.mainButton : s.button}
                onClick={() => setTriageFilter(decision)}
              >
                {decision}
              </button>
            ))}
            <button type="button" style={s.button} onClick={() => setTriageFilter("Tous")}>Voir tout</button>
          </div>
          <p style={{ ...s.small, marginTop: "10px" }}>
            Important : ces choix sont des décisions de classement enregistrées dans le navigateur. Ils ne modifient pas encore les fichiers sur le disque.
          </p>
        </section>

        <section style={s.card}>
          <p style={s.label}>5. Index</p>
          <div style={{ ...s.top, marginBottom: "12px" }}>
            <div>
              <p style={s.count}>{documentStats.total}</p>
              <span style={s.small}>référence(s) · {documentStats.fichiers} fichier(s) repéré(s) · {documentStats.lies} liée(s) · {documentStats.aRapprocher} à rapprocher · {documentStats.doublons} doublon(s) potentiel(s) · {documentStats.aDecider} à décider</span>
            </div>
            <div style={{ ...s.actions, marginTop: 0 }}>
              <input style={{ ...s.input, minWidth: "240px" }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher nom, dossier, chemin..." />
              <select style={s.input} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>Tous</option>
                <option>Actif</option>
                <option>À classer</option>
                <option>Clos</option>
                <option>Archivé</option>
              </select>
              <select style={s.input} value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)}>
                <option>Tous</option>
                <option>Liés</option>
                <option>À rapprocher</option>
                <option>Hors dossiers personnes</option>
              </select>
              <select style={s.input} value={triageFilter} onChange={(e) => setTriageFilter(e.target.value)}>
                <option>Tous</option>
                <option>À décider</option>
                <option>À garder ici</option>
                <option>À déplacer</option>
                <option>À archiver</option>
                <option>Doublon à vérifier</option>
              </select>
            </div>
          </div>

          <div style={s.grid}>
            {filtered.map((doc) => (
              <article key={doc.id} style={s.item}>
                <div>
                  <span style={s.badge}>{doc.categorie}</span>
                  <span style={s.badge}>{doc.statut}</span>
                  {doc.dossierId ? <span style={s.badge}>File active liée</span> : doc.categorie === "Dossier personne" ? <span style={s.badge}>À rapprocher</span> : null}
                </div>
                <h3 style={{ ...s.h3, marginTop: "8px" }}>{doc.libelle}</h3>
                {doc.personne && <p style={{ ...s.intro, marginTop: 0 }}>{doc.personne}</p>}
                <p style={s.path}>{doc.chemin}</p>
                {doc.note && <p style={s.small}>{doc.note}</p>}
                {doc.fileCount > 0 && (
                  <details style={{ marginTop: "10px" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 900, color: "#334052" }}>
                      {doc.fileCount} fichier(s) repéré(s) · {humanFileSize(doc.totalSize)}
                      {doc.duplicateFiles ? ` · ${doc.duplicateFiles} doublon(s) potentiel(s)` : ""}
                    </summary>
                    <div style={{ marginTop: "9px" }}>
                      <p style={s.small}>
                        Types : {Object.entries(doc.extensionCounts || {}).map(([ext, count]) => `${ext} : ${count}`).join(" · ") || "à préciser"}
                      </p>
                      {doc.latestModified ? <p style={s.small}>Dernière modification repérée : {new Date(doc.latestModified).toLocaleDateString("fr-FR")}</p> : null}
                      {(doc.indexedFiles || []).slice(0, 20).map((file) => {
                        const fileKey = file.relativePath || file.chemin || file.name;
                        const decision = (doc.fileTriage || {})[fileKey] || suggestedTriage(file);
                        return (
                          <div key={fileKey} style={{ ...s.item, padding: "8px 10px", marginTop: "7px" }}>
                            <strong style={{ fontSize: "13px" }}>{file.name}</strong>
                            <p style={{ ...s.path, marginBottom: 0 }}>{file.chemin}</p>
                            <div style={s.actions}>
                              <span style={s.badge}>{file.extension}</span>
                              <span style={s.small}>{humanFileSize(file.size)}</span>
                              {file.duplicatePotential && <span style={s.badge}>Doublon potentiel</span>}
                              <select
                                style={s.input}
                                value={decision}
                                onChange={(e) => updateFileTriage(doc.id, file, e.target.value)}
                              >
                                <option>À décider</option>
                                <option>À garder ici</option>
                                <option>À déplacer</option>
                                <option>À archiver</option>
                                <option>Doublon à vérifier</option>
                              </select>
                              <button style={s.button} type="button" onClick={() => copyText(file.chemin, "Chemin du fichier")}>Copier chemin</button>
                            </div>
                          </div>
                        );
                      })}
                      {doc.inventoryTruncated && <p style={s.small}>Affichage limité aux premiers fichiers indexés pour garder l’outil léger. Le nombre total reste comptabilisé.</p>}
                    </div>
                  </details>
                )}
                {doc.categorie === "Dossier personne" && (
                  <label style={{ ...s.field, marginTop: "10px" }}>
                    Dossier de la file active
                    <select style={s.input} value={doc.dossierId || ""} onChange={(e) => updateDocumentDossier(doc.id, e.target.value)}>
                      <option value="">À rapprocher...</option>
                      {rows.map((row, index) => {
                        const id = documentDossierId(row, index);
                        return <option key={id} value={id}>{documentPersonLabel(row)}</option>;
                      })}
                    </select>
                  </label>
                )}
                <div style={s.actions}>
                  <button style={s.button} type="button" onClick={() => copyText(doc.chemin, "Chemin")}>Copier chemin</button>
                  <button style={s.button} type="button" onClick={() => copyText(explorerCommand(doc.chemin), "Commande Explorer")}>Copier commande Explorer</button>
                  <select style={s.input} value={doc.statut} onChange={(e) => updateStatus(doc.id, e.target.value)}>
                    <option>Actif</option>
                    <option>À classer</option>
                    <option>Clos</option>
                    <option>Archivé</option>
                  </select>
                  <button style={s.dangerButton} type="button" onClick={() => removeDocument(doc.id)}>Retirer de l’index</button>
                </div>
              </article>
            ))}
            {filtered.length === 0 && <p style={s.small}>Aucune référence ne correspond à ce filtre.</p>}
          </div>
        </section>

        {message && <p style={{ ...s.notice, fontWeight: 900 }}>{message}</p>}
      </div>
    </main>
  );
}
