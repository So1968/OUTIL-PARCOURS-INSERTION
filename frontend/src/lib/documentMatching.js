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

  return rows
    .map((row, index) => {
      const prenom = normalise(row?.Prénom || row?.Prenom || row?.PrenomUsuel);
      const nom = normalise(row?.Nom);
      const dossierId = documentDossierId(row, index);
      const dossierIdNormalise = normalise(dossierId);

      let score = 0;
      const reasons = [];

      if (dossierIdNormalise && folder.includes(dossierIdNormalise)) {
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

  const strongIdentityMatch =
    best.reasons.includes("numéro dossier") ||
    (best.reasons.includes("nom") && best.reasons.includes("prénom"));

  if (!strongIdentityMatch || best.score < 90) return null;
  if (second && second.score === best.score) return null;

  return {
    dossierId: best.dossierId,
    personne: best.personne,
    score: best.score,
    confidence: "forte",
  };
}
