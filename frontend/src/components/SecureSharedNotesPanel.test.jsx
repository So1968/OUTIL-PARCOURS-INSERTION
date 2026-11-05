import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureSharedNotesPanel } from "./SecureSharedNotesPanel";
import {
  ApiAccessError, lireNotesPartageesSecurisees, lireHistoriqueNotePartageeSecurise,
  creerNotePartageeSecurisee, corrigerNotePartageeSecurisee, validerNotePartageeSecurisee,
} from "../lib/secureApi";

vi.mock("../lib/secureApi", async importOriginal => ({
  ...await importOriginal(),
  lireNotesPartageesSecurisees: vi.fn(), lireHistoriqueNotePartageeSecurise: vi.fn(),
  creerNotePartageeSecurisee: vi.fn(), corrigerNotePartageeSecurisee: vi.fn(), validerNotePartageeSecurisee: vi.fn(),
}));

const id = n => `aaaaaaaa-aaaa-4aaa-aaaa-${String(n).padStart(12, "0")}`;
const caseId = id(1), noteId = id(2), actorId = id(3);
const stamp = "2026-10-26T08:00:00.000Z";
const note = { id: noteId, text: "Note fictive initiale", version: 1, validated: false, updatedAt: stamp, createdAt: stamp };
const revision = (version, text = note.text, validated = false) => ({
  version, text, validated, actorId, reason: "CREATION_BROUILLON", createdAt: stamp,
});
const catalog = (notes = [note], dossierVersion = 1, nextOffset = null) => ({ notes, dossierVersion, nextOffset });
const history = (overrides = {}) => ({
  noteId, noteVersion: 1, validated: false, dossierVersion: 1,
  history: [revision(1)], nextBeforeVersion: null, ...overrides,
});
const load = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Charger les notes partagées" }));
  await screen.findByRole("button", { name: "Recharger les notes" });
};
const open = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Note fictive initiale/ }));
  await screen.findByRole("region", { name: "Version actuelle" });
};
const edit = async () => {
  await load(); await open();
  fireEvent.click(screen.getByRole("button", { name: "Corriger cette note" }));
  fireEvent.change(screen.getByLabelText("Texte de la note"), { target: { value: "Correction fictive proposée" } });
  fireEvent.change(screen.getByLabelText("Motif de correction"), { target: { value: "Précision fictive" } });
};

beforeEach(() => {
  vi.resetAllMocks();
  lireNotesPartageesSecurisees.mockResolvedValue(catalog());
  lireHistoriqueNotePartageeSecurise.mockResolvedValue(history());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("notes partagées servies par l'API", () => {
  it("n'ouvre la saisie qu'après autorisation du serveur et n'utilise aucun stockage navigateur", async () => {
    const reads = vi.spyOn(Storage.prototype, "getItem");
    const writes = vi.spyOn(Storage.prototype, "setItem");
    render(<SecureSharedNotesPanel caseId={caseId} />);
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
    expect(lireNotesPartageesSecurisees).not.toHaveBeenCalled();
    await load();
    expect(lireNotesPartageesSecurisees).toHaveBeenCalledWith({ caseId, offset: 0 });
    expect(screen.getByLabelText("Texte de la note")).toHaveValue("");
    expect(reads).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
  });

  it("crée un brouillon avec la version chargée et garde la validation distincte", async () => {
    lireNotesPartageesSecurisees.mockResolvedValueOnce(catalog([], 0));
    creerNotePartageeSecurisee.mockResolvedValue({ noteId, dossierVersion: 1, validated: false });
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load();
    fireEvent.change(screen.getByLabelText("Texte de la note"), { target: { value: "Note fictive initiale" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));
    await screen.findByText("Note enregistrée. La version précédente reste dans l’historique.");
    expect(creerNotePartageeSecurisee).toHaveBeenCalledExactlyOnceWith({ caseId, text: note.text, expectedVersion: 0 });
    expect(validerNotePartageeSecurisee).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Valider après relecture" })).toBeEnabled();
  });

  it("corrige avec un motif, conserve l'historique et remet la note en brouillon", async () => {
    corrigerNotePartageeSecurisee.mockResolvedValue({ noteId, noteVersion: 2, dossierVersion: 2, validated: false });
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await edit();
    lireNotesPartageesSecurisees.mockResolvedValue(catalog([{ ...note, version: 2, text: "Correction fictive proposée" }], 2));
    lireHistoriqueNotePartageeSecurise.mockResolvedValue(history({ noteVersion: 2, dossierVersion: 2,
      history: [revision(2, "Correction fictive proposée"), revision(1)] }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer la correction" }));
    await screen.findByText("Note enregistrée. La version précédente reste dans l’historique.");
    expect(corrigerNotePartageeSecurisee).toHaveBeenCalledExactlyOnceWith({ caseId, noteId,
      text: "Correction fictive proposée", reason: "Précision fictive", expectedVersion: 1 });
    expect(screen.getByRole("heading", { name: "Version actuelle — Brouillon" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Version 1 — Brouillon" })).toBeInTheDocument();
  });

  it("valide seulement la version relue, sans soumettre un nouveau texte", async () => {
    validerNotePartageeSecurisee.mockResolvedValue({ noteId, noteVersion: 2, dossierVersion: 2, validated: true });
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load(); await open();
    lireNotesPartageesSecurisees.mockResolvedValue(catalog([{ ...note, version: 2, validated: true }], 2));
    lireHistoriqueNotePartageeSecurise.mockResolvedValue(history({ noteVersion: 2, dossierVersion: 2,
      validated: true, history: [revision(2, note.text, true), revision(1)] }));
    fireEvent.click(screen.getByRole("button", { name: "Valider après relecture" }));
    await screen.findByRole("heading", { name: "Version actuelle — Validée" });
    expect(validerNotePartageeSecurisee).toHaveBeenCalledExactlyOnceWith({ caseId, noteId, expectedVersion: 1 });
    expect(screen.queryByRole("button", { name: "Valider après relecture" })).not.toBeInTheDocument();
  });

  it("conserve une correction en conflit et exige comparaison et reprise explicite", async () => {
    corrigerNotePartageeSecurisee.mockRejectedValueOnce(new ApiAccessError(409, "DOSSIER_MODIFIE_ENTRE_TEMPS"));
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await edit();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer la correction" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Texte de la note")).toHaveValue("Correction fictive proposée");
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
    lireNotesPartageesSecurisees.mockResolvedValue(catalog([{ ...note, text: "Version fictive concurrente", version: 2 }], 2));
    lireHistoriqueNotePartageeSecurise.mockResolvedValue(history({ noteVersion: 2, dossierVersion: 2,
      history: [revision(2, "Version fictive concurrente"), revision(1)] }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger les notes" }));
    await screen.findByText("Version actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    expect(within(screen.getByRole("region", { name: "Version actuelle" })).getByText("Version fictive concurrente")).toBeInTheDocument();
    expect(screen.getByLabelText("Texte de la note")).toHaveValue("Correction fictive proposée");
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeEnabled();
    expect(corrigerNotePartageeSecurisee).toHaveBeenCalledTimes(1);
  });

  it("une recharge volontaire pendant la saisie ne remplace pas silencieusement la version attendue", async () => {
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await edit();
    fireEvent.click(screen.getByRole("button", { name: "Recharger les notes" }));
    await screen.findByText("Version actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    expect(screen.getByLabelText("Texte de la note")).toHaveValue("Correction fictive proposée");
  });

  it("ne réessaie pas une création dont la réponse réseau est incertaine", async () => {
    lireNotesPartageesSecurisees.mockResolvedValue(catalog([], 0));
    creerNotePartageeSecurisee.mockRejectedValue(new TypeError("Réseau fictivement indisponible"));
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load();
    fireEvent.change(screen.getByLabelText("Texte de la note"), { target: { value: "Brouillon fictif non confirmé" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Enregistrer le brouillon" })).toBeDisabled();
    expect(screen.getByLabelText("Texte de la note")).toHaveValue("Brouillon fictif non confirmé");
    expect(creerNotePartageeSecurisee).toHaveBeenCalledTimes(1);
  });

  it("un succès suivi d'une panne de recharge reste annoncé comme enregistré", async () => {
    creerNotePartageeSecurisee.mockResolvedValue({ noteId, dossierVersion: 2, validated: false });
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load();
    lireNotesPartageesSecurisees.mockRejectedValue(new TypeError("Panne fictive"));
    fireEvent.change(screen.getByLabelText("Texte de la note"), { target: { value: "Brouillon fictif" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));
    await screen.findByText("Note enregistrée. Rechargez les notes pour actualiser leur affichage.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
    expect(creerNotePartageeSecurisee).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 404])("efface notes et saisie lorsque le serveur retire l'accès (%s)", async status => {
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await edit();
    lireNotesPartageesSecurisees.mockRejectedValue(new ApiAccessError(status));
    fireEvent.click(screen.getByRole("button", { name: "Recharger les notes" }));
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
    expect(screen.queryByText("Note fictive initiale")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Historique de la note" })).not.toBeInTheDocument();
  });

  it("refuse une réponse incomplète sans autoriser d'écriture", async () => {
    lireNotesPartageesSecurisees.mockResolvedValue({ notes: [] });
    render(<SecureSharedNotesPanel caseId={caseId} />);
    fireEvent.click(screen.getByRole("button", { name: "Charger les notes partagées" }));
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
  });

  it("ne présente pas une réponse d'écriture incomplète comme une sauvegarde confirmée", async () => {
    creerNotePartageeSecurisee.mockResolvedValue({});
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load();
    fireEvent.change(screen.getByLabelText("Texte de la note"), { target: { value: "Brouillon fictif" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Texte de la note")).toHaveValue("Brouillon fictif");
    expect(screen.getByRole("button", { name: "Enregistrer le brouillon" })).toBeDisabled();
    expect(lireNotesPartageesSecurisees).toHaveBeenCalledTimes(1);
  });

  it("permet de retrouver une création incertaine sans l'envoyer une seconde fois", async () => {
    lireNotesPartageesSecurisees.mockResolvedValueOnce(catalog([], 0));
    creerNotePartageeSecurisee.mockRejectedValue(new TypeError("Réponse fictivement perdue"));
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load();
    fireEvent.change(screen.getByLabelText("Texte de la note"), { target: { value: note.text } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Recharger les notes" }));
    await screen.findByRole("button", { name: "Ouvrir cette note et abandonner la saisie" });
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir cette note et abandonner la saisie" }));
    await screen.findByRole("region", { name: "Version actuelle" });
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
    expect(creerNotePartageeSecurisee).toHaveBeenCalledTimes(1);
  });

  it("pagine les notes et refuse de mélanger deux états du dossier", async () => {
    const firstPage = Array.from({ length: 25 }, (_, i) => ({ ...note, id: id(i + 10), text: `Note fictive ${i}` }));
    lireNotesPartageesSecurisees.mockResolvedValueOnce(catalog(firstPage, 1, 25));
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load();
    lireNotesPartageesSecurisees.mockResolvedValueOnce(catalog([{ ...note, id: id(50), text: "Autre état fictif" }], 2));
    fireEvent.click(screen.getByRole("button", { name: "Voir d’autres notes" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("Autre état fictif")).not.toBeInTheDocument();
    expect(lireNotesPartageesSecurisees).toHaveBeenLastCalledWith({ caseId, offset: 25 });
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
  });

  it("charge les versions précédentes sans perdre la version actuelle", async () => {
    lireHistoriqueNotePartageeSecurise.mockResolvedValue(history({ noteVersion: 51,
      history: Array.from({ length: 50 }, (_, i) => revision(51 - i)), nextBeforeVersion: 2 }));
    render(<SecureSharedNotesPanel caseId={caseId} />);
    await load(); await open();
    lireHistoriqueNotePartageeSecurise.mockResolvedValue(history({ noteVersion: 51, history: [revision(1)] }));
    fireEvent.click(screen.getByRole("button", { name: "Voir les versions précédentes" }));
    await screen.findByRole("heading", { name: "Version 1 — Brouillon" });
    expect(lireHistoriqueNotePartageeSecurise).toHaveBeenLastCalledWith({ caseId, noteId, beforeVersion: 2 });
    expect(screen.getByRole("heading", { name: "Version 51 — Brouillon" })).toBeInTheDocument();
  });

  it("ignore une réponse tardive d'un dossier après son démontage", async () => {
    let resolve;
    lireNotesPartageesSecurisees.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const view = render(<SecureSharedNotesPanel key="premier" caseId={caseId} />);
    fireEvent.click(screen.getByRole("button", { name: "Charger les notes partagées" }));
    view.rerender(<SecureSharedNotesPanel key="second" caseId={id(4)} />);
    resolve(catalog());
    await waitFor(() => expect(screen.queryByText("Note fictive initiale")).not.toBeInTheDocument());
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
  });
});
