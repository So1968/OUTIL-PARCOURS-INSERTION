// Brouillon manuel : aucune API, aucun envoi et aucune collecte automatique.
// Liste positive de champs. L'analyse professionnelle réservée reste hors du texte.
export function preparerBrouillonMonSuiviSocial({ faits = "", demarches = "", suitePrevue = "" } = {}) {
  function present(value, fallback = "à compléter") {
    return String(value ?? "").trim() || fallback;
  }

  return [
    "Brouillon de suivi — à relire avant toute saisie dans Mon Suivi Social",
    "",
    `Faits / situation abordée :\n${present(faits)}`,
    "",
    `Démarches réalisées :\n${present(demarches)}`,
    "",
    `Suite prévue :\n${present(suitePrevue)}`,
  ].join("\n");
}
