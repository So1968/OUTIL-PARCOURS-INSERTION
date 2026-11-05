import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureCaseAutonomyPanel } from "./SecureCaseAutonomyPanel";
import { ApiAccessError, lireSocleAutonomieSecurise, modifierSocleAutonomieSecurise } from "../lib/secureApi";
import { AUTONOMY_IDS, AUTONOMY_CHOICES } from "../lib/secureAutonomyData";

vi.mock("../lib/secureApi", async original => ({
  ...await original(),
  lireSocleAutonomieSecurise: vi.fn(),
  modifierSocleAutonomieSecurise: vi.fn(),
}));
const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const questions = AUTONOMY_IDS.map((id, index) => ({ id, axe: "Domaine fictif " + index, question: "Question fictive " + index + " ?" }));
const blank = () => ({ caseId, dossierVersion: 1, autonomyVersion: 0, questions, choix: AUTONOMY_CHOICES,
  reponses: {}, history: [], nextBeforeVersion: null });
const answer = { demarches: { reponse: "Ça va", note: "", valide: true } };
const revised = () => ({ ...blank(), dossierVersion: 2, autonomyVersion: 2, reponses: answer,
  history: [{ dossierVersion: 2, previousReponses: {}, reponses: answer,
    actorId, reason: "Saisie fictive", createdAt: "2026-11-05T18:00:00Z" }] });
const mount = () => render(<MemoryRouter><SecureCaseAutonomyPanel caseId={caseId} /></MemoryRouter>);
const load = async () => { fireEvent.click(screen.getByRole("button", { name: "Charger les repères et l’historique" }));
  await screen.findByRole("region", { name: "Repères actuels" }); };
const edit = async () => { await load();
  fireEvent.click(screen.getByRole("button", { name: "Compléter ou corriger les repères" }));
  fireEvent.change(screen.getByLabelText("Réponse — Domaine fictif 0"), { target: { value: "Ça va" } });
  fireEvent.click(screen.getAllByLabelText("Repère noté")[0]);
  fireEvent.change(screen.getByLabelText("Motif de modification"), { target: { value: "Saisie fictive" } }); };
const save = () => fireEvent.click(screen.getByRole("button", { name: "Enregistrer les repères" }));
beforeEach(() => {
  vi.resetAllMocks();
  lireSocleAutonomieSecurise.mockResolvedValue(blank());
  modifierSocleAutonomieSecurise.mockResolvedValue({ caseId, dossierVersion: 2 });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("écran professionnel des huit repères", () => {
  it("ne charge rien avant accord de lecture et n'utilise pas le stockage navigateur", async () => {
    const reads = vi.spyOn(Storage.prototype, "getItem"), writes = vi.spyOn(Storage.prototype, "setItem");
    mount();
    expect(lireSocleAutonomieSecurise).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Repères actuels" })).not.toBeInTheDocument();
    await load();
    expect(screen.getByText("Aucun repère enregistré pour ce dossier.")).toBeInTheDocument();
    expect(reads).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
  });
  it("enregistre un repère explicite et retrouve la version précédente", async () => {
    lireSocleAutonomieSecurise.mockResolvedValueOnce(blank()).mockResolvedValue(revised());
    mount(); await edit(); save();
    await screen.findByText("Repères enregistrés. Les versions précédentes sont conservées.");
    expect(modifierSocleAutonomieSecurise).toHaveBeenCalledExactlyOnceWith({
      caseId, expectedVersion: 1, reponses: answer, reason: "Saisie fictive",
    });
    expect(screen.getByRole("heading", { name: "Version du dossier 2" })).toBeInTheDocument();
  });
  it("refuse saisie inchangée et motif absent", async () => {
    mount(); await load();
    fireEvent.click(screen.getByRole("button", { name: "Compléter ou corriger les repères" }));
    expect(screen.getByRole("button", { name: "Enregistrer les repères" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Réponse — Domaine fictif 0"), { target: { value: "Avec un peu d’aide" } });
    expect(screen.getByRole("button", { name: "Enregistrer les repères" })).toBeDisabled();
    expect(modifierSocleAutonomieSecurise).not.toHaveBeenCalled();
  });
  it("conserve la saisie sur conflit mais exige recharge et relecture", async () => {
    mount(); await edit(); modifierSocleAutonomieSecurise.mockRejectedValueOnce(new ApiAccessError(409)); save();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
    expect(screen.getByLabelText("Réponse — Domaine fictif 0")).toHaveValue("Ça va");
    lireSocleAutonomieSecurise.mockResolvedValue({ ...blank(), dossierVersion: 3 });
    fireEvent.click(screen.getByRole("button", { name: "Recharger les repères" }));
    await screen.findByText("Repères rechargés. Comparez-les avec votre saisie avant de reprendre.");
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Enregistrer les repères" })).toBeEnabled());
    expect(modifierSocleAutonomieSecurise).toHaveBeenCalledTimes(1);
  });
  it("efface les réponses affichées et le brouillon si l'accès est retiré", async () => {
    mount(); await edit(); modifierSocleAutonomieSecurise.mockRejectedValueOnce(new ApiAccessError(404)); save();
    await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Repères actuels" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Réponse — Domaine fictif 0")).not.toBeInTheDocument();
  });
});
