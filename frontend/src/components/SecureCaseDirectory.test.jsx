import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureCaseDirectory } from "./SecureCaseDirectory";
import { loadWritableCases } from "../lib/secureCaseDirectoryApi";
import { ApiAccessError } from "../lib/secureApi";
import { creerDossierSecurise } from "../lib/secureApi";
vi.mock("../lib/secureApi", async original => ({ ...await original(), creerDossierSecurise: vi.fn() }));
vi.mock("../lib/secureCaseDirectoryApi", async original => ({ ...await original(), loadWritableCases: vi.fn() }));
const id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const row = { id, artagReference: "ARTAG-FICTIF", version: 0,
  createdAt: "2026-10-26T08:00:00Z", updatedAt: "2026-10-26T08:00:00Z", canManageReference: true };
const renderDirectory = () => render(<MemoryRouter><SecureCaseDirectory /></MemoryRouter>);
const load = () => fireEvent.click(screen.getByRole("button", { name: "Charger ma file active" }));
beforeEach(() => { vi.resetAllMocks(); loadWritableCases.mockResolvedValue({ cases: [row], nextCursor: null }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("file active accessible en rédaction", () => {
  it("attend le serveur puis ouvre les notes par leur dossier, sans saisie d'identifiant", async () => {
    const read = vi.spyOn(Storage.prototype, "getItem"), write = vi.spyOn(Storage.prototype, "setItem");
    renderDirectory();
    expect(loadWritableCases).not.toHaveBeenCalled(); load();
    const link = await screen.findByRole("link", { name: "Ouvrir les notes partagées" });
    expect(link).toHaveAttribute("href", `/dossiers/${id}/notes-partagees`);
    expect(screen.getByRole("link", { name: "Numéro ARTAG et historique" })).toHaveAttribute("href", `/dossiers/${id}/reference-artag`);
    expect(screen.getByRole("heading", { name: "Numéro ARTAG : ARTAG-FICTIF" })).toBeInTheDocument();
    expect(screen.queryByText(id)).not.toBeInTheDocument();
    expect(read).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
  });
  it("n'offre la création qu'après lecture autorisée, y compris pour une file vide", async () => {
    loadWritableCases.mockResolvedValueOnce({ cases: [], nextCursor: null });
    renderDirectory(); expect(screen.queryByRole("button", { name: "Préparer un dossier" })).not.toBeInTheDocument(); load();
    expect(await screen.findByRole("button", { name: "Préparer un dossier" })).toBeInTheDocument();
  });
  it("un refus de création efface aussi la file et empêche une lecture antérieure de la réafficher", async () => {
    renderDirectory(); load();
    fireEvent.click(await screen.findByRole("button", { name: "Préparer un dossier" }));
    fireEvent.change(screen.getByLabelText("Numéro ARTAG du nouveau dossier"), { target: { value: "ARTAG-CREATION-FICTIVE" } });
    let resolve;
    loadWritableCases.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger ma file active" }));
    creerDossierSecurise.mockRejectedValue(new ApiAccessError(404));
    fireEvent.click(screen.getByRole("button", { name: "Créer le dossier" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("Numéro ARTAG : ARTAG-FICTIF")).not.toBeInTheDocument();
    resolve({ cases: [row], nextCursor: null });
    await screen.findByRole("button", { name: "Charger ma file active" });
    expect(screen.queryByText("Numéro ARTAG : ARTAG-FICTIF")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Numéro ARTAG du nouveau dossier")).not.toBeInTheDocument();
  });
  it("n'ouvre pas un dossier sans numéro ARTAG et ne crée pas de référence fictive", async () => {
    loadWritableCases.mockResolvedValue({ cases: [{ ...row, artagReference: null }], nextCursor: null });
    renderDirectory(); load();
    await screen.findByRole("heading", { name: "Numéro ARTAG non renseigné" });
    expect(screen.queryByRole("link", { name: "Ouvrir les notes partagées" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Numéro ARTAG et historique" })).not.toBeInTheDocument();
  });
  it("une délégation de rédaction ne propose pas de correction de l'identification", async () => {
    loadWritableCases.mockResolvedValue({ cases: [{ ...row, canManageReference: false }], nextCursor: null });
    renderDirectory(); load();
    await screen.findByRole("link", { name: "Ouvrir les notes partagées" });
    expect(screen.queryByRole("link", { name: "Numéro ARTAG et historique" })).not.toBeInTheDocument();
  });
  it.each([401, 403, 404])("efface les références affichées lorsque l'accès est retiré (%s)", async status => {
    renderDirectory(); load();
    await screen.findByText("Numéro ARTAG : ARTAG-FICTIF");
    loadWritableCases.mockRejectedValue(new ApiAccessError(status));
    fireEvent.click(screen.getByRole("button", { name: "Recharger ma file active" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("Numéro ARTAG : ARTAG-FICTIF")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ouvrir les notes partagées" })).not.toBeInTheDocument();
  });
  it("pagine les dossiers sans réutiliser une page dupliquée", async () => {
    loadWritableCases.mockResolvedValueOnce({ cases: [row], nextCursor: "curseurFictif" });
    renderDirectory(); load();
    fireEvent.click(await screen.findByRole("button", { name: "Voir d’autres dossiers" }));
    await screen.findByRole("alert");
    expect(loadWritableCases).toHaveBeenLastCalledWith("curseurFictif");
    expect(screen.getAllByRole("link", { name: "Ouvrir les notes partagées" })).toHaveLength(1);
  });
  it("signale une file vide autorisée et conserve une réponse tardive hors de l'écran démonté", async () => {
    loadWritableCases.mockResolvedValueOnce({ cases: [], nextCursor: null });
    const view = renderDirectory(); load();
    await screen.findByRole("status");
    let resolve;
    loadWritableCases.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger ma file active" }));
    view.unmount(); resolve({ cases: [row], nextCursor: null });
    expect(screen.queryByText("Numéro ARTAG : ARTAG-FICTIF")).not.toBeInTheDocument();
  });
});
