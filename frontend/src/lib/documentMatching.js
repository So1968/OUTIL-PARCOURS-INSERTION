function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return normalise(value).split(/\s+/).filter(Boolean);
}

export function documentDossierId(row, index) {
  const fields = ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier"];
  for (const field of fields) {
    if (row?.[field]) return String(row[field]);
  }
  return row?.__id || `dossier-${index}`;
}

export function documentPersonLabel(row) {
  const prenom = String(row?.Prénom || row?.Prenom || row?.PrenomUsuel || "").trim();
  const nom = String(row?.Nom || "").trim();
  return [nom.toUpperCase(), prenom].filter(Boolean).join(" ").trim() || "Dossier";
}

export function rankDocumentMatches(folderName, rows = []) {
  const folder = normalise(folderName);
  const folderTokens = new Set(tokens(folderName));
  const folderWithBoundaries = ` ${folder} `;

  return rows
    .map((row, index) => {
      const prenom = normalise(row?.Prénom || row?.Prenom || row?.PrenomUsuel);
      const nom = normalise(row?.Nom);
      const dossierId = documentDossierId(row, index);
      const dossierIdNormalise = normalise(dossierId);

      let score = 0;
      const reasons = [];

      // Ne jamais rapprocher un dossier par sous-chaîne (ex. 123 dans 12345).
      // L'identifiant de repli "dossier-<index>" n'est pas stable après réimport.
      const hasStableIdentifier = [
        "Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier", "__id",
      ].some((field) => Boolean(row?.[field]));
      if (hasStableIdentifier && dossierIdNormalise
        && folderWithBoundaries.includes(` ${dossierIdNormalise} `)) {
        score += 120;
        reasons.push("numéro dossier");
      }

      if (nom && folderTokens.has(nom)) {
        score += 55;
        reasons.push("nom");
      }

      if (prenom && folderTokens.has(prenom)) {
        score += 45;
        reasons.push("prénom");
      }

      if (nom && prenom && folder.includes(`${nom} ${prenom}`)) {
        score += 20;
      }
      if (nom && prenom && folder.includes(`${prenom} ${nom}`)) {
        score += 20;
      }

      return {
        row,
        dossierId,
        personne: documentPersonLabel(row),
        score,
        reasons,
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.personne.localeCompare(b.personne));
}

export function findAutomaticDocumentMatch(folderName, rows = []) {
  const ranked = rankDocumentMatches(folderName, rows);
  if (!ranked.length) return null;

  const best = ranked[0];
  const second = ranked[1];

  // Une identité nominative n'est jamais assez stable pour lier automatiquement
  // des documents sociaux : homonymie, nom d'usage ou changement de référente.
  // Le nom et le prénom restent seulement des indices pour la revue humaine.
  const stableIdFields = ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier"];
  const stableId = stableIdFields.some(field => String(best.row?.[field] ?? "").trim());
  if (!stableId || !best.reasons.includes("numéro dossier") || best.score < 120) return null;
  if (second && second.score === best.score) return null;

  return {
    dossierId: best.dossierId,
    personne: best.personne,
    score: best.score,
    confidence: "forte",
  };
}
