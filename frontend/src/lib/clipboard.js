// Une copie n'est confirmée qu'après résolution de l'API du navigateur.
export async function copyText(text) {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
