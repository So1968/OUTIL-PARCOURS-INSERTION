// Contrôle du fichier AVANT de remplacer une file active dans le prototype.
// Aucun rapprochement sur le nom/prénom : l'identifiant métier est obligatoire.
export const CHAMPS_IDENTIFIANT_IMPORT = [
  "Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier",
];

export function identifiantImport(row) {
  for (const champ of CHAMPS_IDENTIFIANT_IMPORT) {
    const value = String(row?.[champ] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function analyserImportDossiers(rows, existingRows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: "Aucune ligne exploitable dans le fichier CSV." };
  }

  const ids = rows.map(identifiantImport);
  const withoutId = ids.filter((id) => !id).length;
  if (withoutId) {
    return {
      ok: false,
      message: `Import refusé : ${withoutId} ligne(s) sans numéro de dossier stable. Aucun dossier n'a été remplacé.`,
    };
  }

  const encountered = new Set();
  let duplicated = 0;
  for (const id of ids) {
    const normalized = id.toLocaleUpperCase("fr-FR");
    if (encountered.has(normalized)) duplicated += 1;
    encountered.add(normalized);
  }
  if (duplicated) {
    return {
      ok: false,
      message: `Import refusé : ${duplicated} numéro(s) de dossier répété(s). Vérifie le CSV avant de recommencer.`,
    };
  }

  const previous = new Set(
    existingRows.map(identifiantImport).filter(Boolean).map((id) => id.toLocaleUpperCase("fr-FR")),
  );
  const incoming = new Set(ids.map((id) => id.toLocaleUpperCase("fr-FR")));
  const missingFromImport = [...previous].filter((id) => !incoming.has(id)).length;
  const newInImport = [...incoming].filter((id) => !previous.has(id)).length;

  return {
    ok: true,
    total: rows.length,
    newInImport,
    missingFromImport,
    alreadyPresent: incoming.size - newInImport,
  };
}
