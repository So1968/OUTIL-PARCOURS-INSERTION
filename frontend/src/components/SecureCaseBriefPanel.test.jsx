import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureCaseBriefPanel } from "./SecureCaseBriefPanel";
import { ApiAccessError, lireBlocCourtSecurise, modifierBlocCourtSecurise } from "../lib/secureApi";
import { BRIEF_TYPES } from "../lib/secureCaseBriefData";

vi.mock("../lib/secureApi", async original => ({
  ...await original(),
  lireBlocCourtSecurise: vi.fn(),
  modifierBlocCourtSecurise: vi.fn(),
}));
const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const empty = type => Object.fromEntries(BRIEF_TYPES[type].fields.map(([field]) => [field, ""]));
const blank = type => ({ caseId, type, dossierVersion: 1, briefVersion: 0, content: empty(type),
  history: [], nextBeforeVersion: null });
const updated = type => {
  const field = BRIEF_TYPES[type].fields[0][0];
  const content = { ...empty(type), [field]: "Fait fictif" };
  return { ...blank(type), dossierVersion: 2, briefVersion: 2, content,
    history: [{ dossierVersion: 2, previousContent: empty(type), content,
      actorId, reason: "Correction fictive", createdAt: "2026-11-05T19:00:00Z" }] };
};
const mount = (type = "synthese-courte") =>
  render(<MemoryRouter><SecureCaseBriefPanel caseId={caseId} type={type} /></MemoryRouter>);
const load = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Charger le bloc et l’historique" }));
  await screen.findByRole("region", { name: "Version actuelle" });
};
const prepare = async (label = "Situation globale") => {
  await load();
  fireEvent.click(screen.getByRole("button", { name: "Compléter ou corriger ce bloc" }));
  fireEvent.change(screen.getByLabelText(label), { target: { value: "Fait fictif" } });
  fireEvent.change(screen.getByLabelText("Motif de modification"),
    { target: { value: "Correction fictive" } });
};
const save = () => fireEvent.click(screen.getByRole("button", { name: "Enregistrer le bloc" }));

beforeEach(() => {
  vi.resetAllMocks();
  lireBlocCourtSecurise.mockImplementation(async ({ type }) => blank(type));
  modifierBlocCourtSecurise.mockImplementation(async ({ type }) => ({ caseId, type, dossierVersion: 2 }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("écrans serveur de synthèse et continuité", () => {
  it("ne lit aucun dossier avant action et ne conserve rien en stockage navigateur", async () => {
    const localReads = vi.spyOn(Storage.prototype, "getItem"), localWrites = vi.spyOn(Storage.prototype, "setItem");
    mount();
    expect(lireBlocCourtSecurise).not.toHaveBeenCalled();
    await load();
    expect(screen.getAllByText("Non renseigné")).toHaveLength(6);
    expect(localReads).not.toHaveBeenCalled();
    expect(localWrites).not.toHaveBeenCalled();
  });

  it("modifie une synthèse et affiche l'état et l'historique récupérés du serveur", async () => {
    lireBlocCourtSecurise.mockResolvedValueOnce(blank("synthese-courte"))
      .mockResolvedValue(updated("synthese-courte"));
    mount(); await prepare(); save();
    await screen.findByText("Bloc enregistré. Les versions précédentes sont conservées.");
    expect(modifierBlocCourtSecurise).toHaveBeenCalledExactlyOnceWith({
      caseId, type: "synthese-courte", expectedVersion: 1,
      content: { ...empty("synthese-courte"), situationGlobale: "Fait fictif" },
      reason: "Correction fictive",
    });
    expect(screen.getByRole("heading", { name: "Version du dossier 2" })).toBeInTheDocument();
  });

  it("la note de continuité est distincte et ses rubriques sont spécifiques", async () => {
    mount("note-continuite"); await prepare("Situation en cours");
    expect(screen.getByLabelText("Priorité immédiate")).toBeInTheDocument();
    expect(screen.queryByLabelText("Points d’appui")).not.toBeInTheDocument();
    save();
    await waitFor(() => expect(modifierBlocCourtSecurise).toHaveBeenCalledWith(expect.objectContaining({
      type: "note-continuite",
      content: { ...empty("note-continuite"), situationEnCours: "Fait fictif" },
    })));
  });

  it("un conflit conserve le brouillon, impose une recharge et une relecture manuelle", async () => {
    mount(); await prepare();
    modifierBlocCourtSecurise.mockRejectedValueOnce(new ApiAccessError(409));
    save();
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Situation globale")).toHaveValue("Fait fictif");
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
    lireBlocCourtSecurise.mockResolvedValue({ ...blank("synthese-courte"), dossierVersion: 3 });
    fireEvent.click(screen.getByRole("button", { name: "Recharger le bloc" }));
    await screen.findByText("Version rechargée. Comparez l’état actuel à votre saisie avant de reprendre.");
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    expect(screen.getByRole("button", { name: "Enregistrer le bloc" })).toBeEnabled();
    expect(modifierBlocCourtSecurise).toHaveBeenCalledTimes(1);
  });

  it("perte des droits : efface la synthèse et le brouillon visibles", async () => {
    mount(); await prepare();
    modifierBlocCourtSecurise.mockRejectedValueOnce(new ApiAccessError(404));
    save(); await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Version actuelle" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Situation globale")).not.toBeInTheDocument();
  });
});
