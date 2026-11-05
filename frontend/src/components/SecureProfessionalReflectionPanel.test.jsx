import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureProfessionalReflectionPanel } from "./SecureProfessionalReflectionPanel";
import {
  ApiAccessError, lireReflexionProfessionnelleSecurisee, modifierReflexionProfessionnelleSecurisee,
} from "../lib/secureApi";
import { emptyReflection } from "../lib/secureProfessionalReflectionData";

vi.mock("../lib/secureApi", async original => ({
  ...await original(),
  lireReflexionProfessionnelleSecurisee: vi.fn(),
  modifierReflexionProfessionnelleSecurisee: vi.fn(),
}));
const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const blank = emptyReflection();
const initial = () => ({
  caseId, dossierVersion: 1, reflectionVersion: 0,
  content: blank, history: [], nextBeforeVersion: null,
});
const after = () => {
  const content = { ...blank, entreeRelation: "Observation fictive vérifiée" };
  return {
    caseId, dossierVersion: 2, reflectionVersion: 2, content,
    history: [{
      dossierVersion: 2, previousContent: blank, content,
      actorId, reason: "Correction fictive", createdAt: "2026-11-05T19:00:00Z",
    }], nextBeforeVersion: null,
  };
};
const mount = () => render(<MemoryRouter>
  <SecureProfessionalReflectionPanel caseId={caseId} />
</MemoryRouter>);
const load = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Charger ma réflexion réservée" }));
  await screen.findByRole("region", { name: "État actuel réservé" });
};
const prepare = async () => {
  await load();
  fireEvent.click(screen.getByRole("button", { name: "Compléter ou corriger ma réflexion" }));
  fireEvent.change(screen.getByLabelText("Entrée en relation"),
    { target: { value: "Observation fictive vérifiée" } });
  fireEvent.change(screen.getByLabelText("Motif de modification"),
    { target: { value: "Correction fictive" } });
};
const save = () => fireEvent.click(screen.getByRole("button", { name: "Enregistrer ma réflexion" }));

beforeEach(() => {
  vi.resetAllMocks();
  lireReflexionProfessionnelleSecurisee.mockResolvedValue(initial());
  modifierReflexionProfessionnelleSecurisee.mockResolvedValue({ caseId, dossierVersion: 2 });
});
afterEach(() => cleanup());

describe("interface de réflexion professionnelle réservée", () => {
  it("ne charge rien sans action et n'utilise pas le stockage de démonstration", async () => {
    const readLocal = vi.spyOn(Storage.prototype, "getItem");
    const writeLocal = vi.spyOn(Storage.prototype, "setItem");
    mount();
    expect(lireReflexionProfessionnelleSecurisee).not.toHaveBeenCalled();
    await load();
    expect(screen.getAllByText("Non renseigné")).toHaveLength(6);
    expect(readLocal).not.toHaveBeenCalled();
    expect(writeLocal).not.toHaveBeenCalled();
    readLocal.mockRestore(); writeLocal.mockRestore();
  });

  it("édite uniquement les six axes et retrouve la version serveur après enregistrement", async () => {
    lireReflexionProfessionnelleSecurisee.mockResolvedValueOnce(initial())
      .mockResolvedValue(after());
    mount();
    await prepare();
    expect(screen.queryByLabelText("Diagnostic")).not.toBeInTheDocument();
    save();
    await screen.findByText("Réflexion réservée enregistrée. Les versions antérieures restent accessibles à l’autrice.");
    expect(modifierReflexionProfessionnelleSecurisee).toHaveBeenCalledExactlyOnceWith({
      caseId, expectedVersion: 1,
      content: { ...blank, entreeRelation: "Observation fictive vérifiée" },
      reason: "Correction fictive",
    });
    expect(screen.getByRole("heading", { name: "Version du dossier 2" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Entrée en relation")).not.toBeInTheDocument();
  });

  it("conserve le brouillon et impose relecture avant de reprendre après conflit", async () => {
    mount(); await prepare();
    modifierReflexionProfessionnelleSecurisee.mockRejectedValueOnce(new ApiAccessError(409));
    save();
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Entrée en relation")).toHaveValue("Observation fictive vérifiée");
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
    lireReflexionProfessionnelleSecurisee.mockResolvedValue({ ...initial(), dossierVersion: 3 });
    fireEvent.click(screen.getByRole("button", { name: "Recharger ma réflexion" }));
    await screen.findByText("Réflexion rechargée. Comparez votre brouillon avec l'état actuel.");
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    expect(screen.getByRole("button", { name: "Enregistrer ma réflexion" })).toBeEnabled();
    expect(modifierReflexionProfessionnelleSecurisee).toHaveBeenCalledTimes(1);
  });

  it("retire le contenu et le brouillon si l'accès est refusé", async () => {
    mount(); await prepare();
    modifierReflexionProfessionnelleSecurisee.mockRejectedValueOnce(new ApiAccessError(404));
    save();
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByRole("region", { name: "État actuel réservé" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Entrée en relation")).not.toBeInTheDocument();
    expect(screen.queryByText("Observation fictive vérifiée")).not.toBeInTheDocument();
  });
});
