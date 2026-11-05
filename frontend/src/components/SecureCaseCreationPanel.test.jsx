import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureCaseCreationPanel } from "./SecureCaseCreationPanel";
import { ApiAccessError, creerDossierSecurise } from "../lib/secureApi";
vi.mock("../lib/secureApi", async original => ({ ...await original(), creerDossierSecurise: vi.fn() }));
const requestId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", caseId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const reference = "ARTAG-NOUVEAU-FICTIF";
const result = (overrides = {}) => ({ requestId, created: true, caseId, artagReference: reference, dossierVersion: 1, ...overrides });
const renderPanel = props => render(<MemoryRouter><SecureCaseCreationPanel {...props} /></MemoryRouter>);
const prepare = () => { fireEvent.click(screen.getByRole("button", { name: "Préparer un dossier" }));
  fireEvent.change(screen.getByLabelText("Numéro ARTAG du nouveau dossier"), { target: { value: reference } }); };
const create = () => fireEvent.click(screen.getByRole("button", { name: "Créer le dossier" }));
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(crypto, "randomUUID").mockReturnValue(requestId);
  creerDossierSecurise.mockResolvedValue(result()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("création contrôlée de dossier", () => {
  it("attend une préparation explicite et ouvre le dossier confirmé sans stockage navigateur", async () => {
    const reads = vi.spyOn(Storage.prototype, "getItem"), writes = vi.spyOn(Storage.prototype, "setItem");
    renderPanel(); expect(creerDossierSecurise).not.toHaveBeenCalled(); prepare(); create();
    await screen.findByRole("region", { name: "Dossier créé ou retrouvé" });
    expect(creerDossierSecurise).toHaveBeenCalledExactlyOnceWith({ requestId, artagReference: reference });
    expect(screen.getByRole("link", { name: "Ouvrir les notes du dossier" })).toHaveAttribute("href", `/dossiers/${caseId}/notes-partagees`);
    expect(screen.getByRole("link", { name: "Voir le numéro et son historique" })).toHaveAttribute("href", `/dossiers/${caseId}/reference-artag`);
    expect(screen.queryByLabelText("Numéro ARTAG du nouveau dossier")).not.toBeInTheDocument();
    expect(reads).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
  });
  it("refuse un numéro absent ou malformé sans générer de demande", () => {
    renderPanel(); prepare();
    for (const value of ["", " ARTAG", "x".repeat(81), "\ud800"]) {
      fireEvent.change(screen.getByLabelText("Numéro ARTAG du nouveau dossier"), { target: { value } });
      expect(screen.getByRole("button", { name: "Créer le dossier" })).toBeDisabled();
    }
    expect(crypto.randomUUID).not.toHaveBeenCalled(); expect(creerDossierSecurise).not.toHaveBeenCalled();
  });
  it("garde exactement la même demande après une réponse perdue, sans renvoi automatique", async () => {
    creerDossierSecurise.mockRejectedValueOnce(new TypeError("Réponse fictivement perdue"));
    renderPanel(); prepare(); create(); await screen.findByRole("alert");
    expect(creerDossierSecurise).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Numéro ARTAG du nouveau dossier")).toBeDisabled();
    creerDossierSecurise.mockResolvedValueOnce(result({ created: false, artagReference: "ARTAG-FICTIF-CORRIGE", dossierVersion: 4 }));
    fireEvent.click(screen.getByRole("button", { name: "Vérifier cette création" }));
    await screen.findByText("Création retrouvée. Aucun nouveau dossier n’a été ajouté.");
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(creerDossierSecurise.mock.calls[0]).toEqual(creerDossierSecurise.mock.calls[1]);
    expect(screen.getByRole("heading", { name: "Numéro ARTAG : ARTAG-FICTIF-CORRIGE" })).toBeInTheDocument();
  });
  it("une confirmation étrangère reste incertaine et conserve la clé initiale", async () => {
    creerDossierSecurise.mockResolvedValueOnce(result({ requestId: caseId }));
    renderPanel(); prepare(); create(); await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Dossier créé ou retrouvé" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vérifier cette création" })).toBeEnabled();
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
  it("un conflit ne dévoile aucun autre dossier ni ne remplace la demande", async () => {
    creerDossierSecurise.mockRejectedValue(new ApiAccessError(409, "CREATION_DOSSIER_EN_CONFLIT"));
    renderPanel(); prepare(); create();
    expect(await screen.findByRole("alert")).toHaveTextContent("Ce numéro ou cette demande ne peut pas être utilisé.");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Numéro ARTAG du nouveau dossier")).toHaveValue(reference);
    expect(screen.getByLabelText("Numéro ARTAG du nouveau dossier")).toBeDisabled();
  });
  it.each([401, 403, 404])("efface la saisie et signale le retrait d'accès au parent (%s)", async status => {
    const onAccessLost = vi.fn(); creerDossierSecurise.mockRejectedValue(new ApiAccessError(status));
    renderPanel({ onAccessLost }); prepare(); create(); await screen.findByRole("alert");
    expect(screen.queryByLabelText("Numéro ARTAG du nouveau dossier")).not.toBeInTheDocument();
    expect(onAccessLost).toHaveBeenCalledTimes(1);
  });
  it("empêche une double création et ignore la confirmation après démontage", async () => {
    let resolve; creerDossierSecurise.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const view = renderPanel(); prepare();
    const button = screen.getByRole("button", { name: "Créer le dossier" });
    fireEvent.click(button); fireEvent.click(button);
    expect(creerDossierSecurise).toHaveBeenCalledTimes(1);
    view.unmount(); resolve(result());
    await waitFor(() => expect(screen.queryByRole("region", { name: "Dossier créé ou retrouvé" })).not.toBeInTheDocument());
  });
  it("fermer une demande incertaine ne prétend pas annuler une création déjà envoyée", async () => {
    creerDossierSecurise.mockRejectedValueOnce(new TypeError("Panne fictive"));
    renderPanel(); prepare(); create(); await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Fermer cette demande" }));
    expect(screen.getByRole("status")).toHaveTextContent("Rechargez la file active avant de préparer une autre création.");
    expect(creerDossierSecurise).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Numéro ARTAG du nouveau dossier")).not.toBeInTheDocument();
  });
});
