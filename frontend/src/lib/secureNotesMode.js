// Activation de recette explicite ; ne constitue jamais un droit d'accès.
export function secureNotesModeRequested() {
  return import.meta.env.VITE_ARTAG_SECURE_NOTES === "1";
}

export function secureNotesApiEnabled() {
  return secureNotesModeRequested()
    && typeof window !== "undefined" && window.location.protocol === "https:";
}
