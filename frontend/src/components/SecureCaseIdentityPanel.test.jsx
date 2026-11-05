import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureCaseIdentityPanel } from "./SecureCaseIdentityPanel";
import { ApiAccessError, lireIdentiteSecurisee, modifierIdentiteSecurisee } from "../lib/secureApi";
vi.mock("../lib/secureApi", async original => ({ ...await original(), lireIdentiteSecurisee: vi.fn(), modifierIdentiteSecurisee: vi.fn() }));
const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const blank = { lastName: null, firstName: null, insertisNumber: null, age: null };
const identity = { lastName: "FICTIF D’EXEMPLE", firstName: "Recette", insertisNumber: "INSERTIS-FICTIF", age: 40 };
const revision = (version, current = identity, previous = blank) => ({ dossierVersion: version, identity: current, previousIdentity: previous,
  actorId, reason: "Vérification fictive", createdAt: "2026-10-26T18:00:00Z" });
const page = overrides => ({ caseId, artagReference: "ARTAG-IDENTITE-FICTIVE", dossierVersion: 1, identityVersion: 0, identity: blank,
  history: [], nextBeforeVersion: null, ...overrides });
const renderPanel = () => render(<MemoryRouter><SecureCaseIdentityPanel caseId={caseId} /></MemoryRouter>);
const load = async () => { fireEvent.click(screen.getByRole("button", { name: "Charger l’identité et l’historique" })); await screen.findByRole("region", { name: "Identité actuelle" }); };
const edit = async () => { await load(); fireEvent.click(screen.getByRole("button", { name: "Compléter ou corriger l’identité" }));
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: identity.lastName } });
  fireEvent.change(screen.getByLabelText("Motif de modification"), { target: { value: "Saisie fictive vérifiée" } }); };
const save = () => fireEvent.click(screen.getByRole("button", { name: "Enregistrer l’identité" }));
beforeEach(() => { vi.resetAllMocks(); lireIdentiteSecurisee.mockResolvedValue(page()); modifierIdentiteSecurisee.mockResolvedValue({ caseId, dossierVersion: 2 }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("bloc identité serveur", () => {
  it("attend la lecture autorisée sans stockage navigateur, sans identité ni âge inventés", async () => {
    const reads = vi.spyOn(Storage.prototype, "getItem"), writes = vi.spyOn(Storage.prototype, "setItem");
    renderPanel(); expect(lireIdentiteSecurisee).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Nom")).not.toBeInTheDocument(); await load();
    const current = within(screen.getByRole("region", { name: "Identité actuelle" }));
    expect(current.getAllByText("Non renseigné")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Numéro ARTAG et historique" })).toHaveAttribute("href", `/dossiers/${caseId}/reference-artag`);
    expect(reads).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
  });
  it("enregistre une identité partielle et l'âge zéro, puis montre la première révision", async () => {
    renderPanel(); await edit();
    fireEvent.change(screen.getByLabelText("Âge"), { target: { value: "0" } });
    const next = { ...blank, lastName: identity.lastName, age: 0 };
    lireIdentiteSecurisee.mockResolvedValue(page({ identity: next, dossierVersion: 2, identityVersion: 2, history: [revision(2, next)] }));
    save(); await screen.findByText("Identité enregistrée. Les valeurs précédentes restent dans l’historique.");
    expect(modifierIdentiteSecurisee).toHaveBeenCalledExactlyOnceWith({ caseId, expectedVersion: 1, identity: next, reason: "Saisie fictive vérifiée" });
    const current = within(screen.getByRole("region", { name: "Identité actuelle" }));
    expect(current.getByText("0")).toBeInTheDocument(); expect(current.getAllByText("Non renseigné")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Version du dossier 2" })).toBeInTheDocument();
  });
  it("permet une correction explicite vers une valeur inconnue sans effacer l'historique", async () => {
    lireIdentiteSecurisee.mockResolvedValueOnce(page({ identity, identityVersion: 2, dossierVersion: 3, history: [revision(2)] }));
    modifierIdentiteSecurisee.mockResolvedValueOnce({ caseId, dossierVersion: 4 });
    renderPanel(); await edit(); fireEvent.change(screen.getByLabelText("Âge"), { target: { value: "" } });
    const next = { ...identity, age: null };
    lireIdentiteSecurisee.mockResolvedValue(page({ identity: next, identityVersion: 4, dossierVersion: 4,
      history: [revision(4, next, identity), revision(2)] }));
    save(); await screen.findByText("Identité enregistrée. Les valeurs précédentes restent dans l’historique.");
    expect(modifierIdentiteSecurisee).toHaveBeenCalledWith(expect.objectContaining({ identity: next, expectedVersion: 3 }));
    expect(screen.getByRole("heading", { name: "Version du dossier 2" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Historique de l’identité" })).getAllByText("40")).toHaveLength(2);
  });
  it("refuse une saisie inchangée, un motif absent et les champs malformés", async () => {
    renderPanel(); await load(); fireEvent.click(screen.getByRole("button", { name: "Compléter ou corriger l’identité" }));
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "FICTIF" } });
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motif de modification"), { target: { value: "Saisie fictive" } });
    for (const age of ["-1", "1.5", "1e2", "2147483648"]) {
      fireEvent.change(screen.getByLabelText("Âge"), { target: { value: age } });
      expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    }
    fireEvent.change(screen.getByLabelText("Âge"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: " FICTIF" } });
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    expect(modifierIdentiteSecurisee).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404])("efface champs, identité et historique après un refus %s", async status => {
    renderPanel(); await edit(); modifierIdentiteSecurisee.mockRejectedValue(new ApiAccessError(status)); save();
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Nom")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Identité actuelle" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Historique de l’identité" })).not.toBeInTheDocument();
  });
  it("un conflit conserve la saisie et demande recharge, comparaison et reprise explicite", async () => {
    renderPanel(); await edit(); modifierIdentiteSecurisee.mockRejectedValueOnce(new ApiAccessError(409)); save();
    await screen.findByRole("alert"); expect(screen.getByLabelText("Nom")).toHaveValue(identity.lastName);
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
    lireIdentiteSecurisee.mockResolvedValue(page({ dossierVersion: 3 }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger l’identité" }));
    await screen.findByText("Identité actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeEnabled();
    expect(modifierIdentiteSecurisee).toHaveBeenCalledTimes(1);
  });
  it("une recharge volontaire pendant la saisie ne remplace pas sa version silencieusement", async () => {
    renderPanel(); await edit(); fireEvent.click(screen.getByRole("button", { name: "Recharger l’identité" }));
    await screen.findByText("Identité actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    expect(screen.getByLabelText("Nom")).toHaveValue(identity.lastName);
  });
  it("retrouve une modification incertaine par lecture sans la renvoyer", async () => {
    renderPanel(); await edit(); modifierIdentiteSecurisee.mockRejectedValueOnce(new TypeError("Réponse fictivement perdue")); save();
    await screen.findByRole("alert"); expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    const saved = { ...blank, lastName: identity.lastName };
    lireIdentiteSecurisee.mockResolvedValue(page({ identity: saved, dossierVersion: 2, identityVersion: 2, history: [revision(2, saved)] }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger l’identité" }));
    await screen.findByText("Identité actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    expect(modifierIdentiteSecurisee).toHaveBeenCalledTimes(1);
  });
  it("un succès suivi d'une lecture refusée reste enregistré et retire l'ancien affichage", async () => {
    renderPanel(); await edit(); lireIdentiteSecurisee.mockRejectedValue(new ApiAccessError(404)); save();
    await screen.findByText("Identité enregistrée. Rechargez pour actualiser l’affichage ; aucun nouvel enregistrement n’est nécessaire.");
    expect(screen.queryByLabelText("Nom")).not.toBeInTheDocument(); expect(screen.queryByRole("region", { name: "Identité actuelle" })).not.toBeInTheDocument();
  });
  it("une réponse de mutation étrangère ou un historique incohérent ne permet pas une autre écriture", async () => {
    renderPanel(); await edit(); modifierIdentiteSecurisee.mockResolvedValueOnce({ caseId: actorId, dossierVersion: 2 }); save();
    await screen.findByRole("alert"); expect(screen.getByRole("button", { name: "Enregistrer l’identité" })).toBeDisabled();
    lireIdentiteSecurisee.mockRejectedValueOnce(new ApiAccessError(409, "HISTORIQUE_IDENTITE_INDISPONIBLE"));
    fireEvent.click(screen.getByRole("button", { name: "Recharger l’identité" }));
    await screen.findByText("L’historique de l’identité doit être vérifié avant toute modification.");
    expect(screen.queryByRole("region", { name: "Identité actuelle" })).not.toBeInTheDocument();
  });
  it("refuse une réponse incomplète, étrangère ou une chaîne de versions incohérente", async () => {
    for (const payload of [{}, page({ caseId: actorId }), page({ identity: { lastName: "FICTIF" } }),
      page({ identityVersion: 2, identity, dossierVersion: 2, history: [] }),
      page({ identityVersion: 2, identity, dossierVersion: 2, history: [revision(2), revision(1)] }),
      page({ identity: { ...blank, age: -1 } })]) {
      lireIdentiteSecurisee.mockResolvedValueOnce(payload); const view = renderPanel();
      fireEvent.click(screen.getByRole("button", { name: "Charger l’identité et l’historique" })); await screen.findByRole("alert");
      expect(screen.queryByRole("button", { name: "Compléter ou corriger l’identité" })).not.toBeInTheDocument(); view.unmount();
    }
  });
  it("bloque le mélange avec un dossier modifié entre deux pages", async () => {
    const value = v => ({ ...identity, lastName: `FICTIF-${v}` });
    const revisions = Array.from({ length: 50 }, (_, i) => revision(52 - i, value(52 - i), value(51 - i)));
    lireIdentiteSecurisee.mockResolvedValueOnce(page({ identity: value(52), identityVersion: 52, dossierVersion: 53, history: revisions, nextBeforeVersion: 3 }));
    renderPanel(); await load();
    lireIdentiteSecurisee.mockResolvedValueOnce(page({ identity: value(54), identityVersion: 54, dossierVersion: 54,
      history: [revision(2, value(2), value(1)), revision(1, value(1))] }));
    fireEvent.click(screen.getByRole("button", { name: "Voir les versions précédentes" })); await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Version du dossier 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compléter ou corriger l’identité" })).toBeDisabled();
  });
  it("ajoute les versions précédentes sans perdre la dernière identité", async () => {
    const value = v => ({ ...identity, lastName: `FICTIF-${v}` });
    const revisions = Array.from({ length: 50 }, (_, i) => revision(52 - i, value(52 - i), value(51 - i)));
    lireIdentiteSecurisee.mockResolvedValueOnce(page({ identity: value(52), identityVersion: 52, dossierVersion: 53, history: revisions, nextBeforeVersion: 3 }));
    renderPanel(); await load();
    lireIdentiteSecurisee.mockResolvedValueOnce(page({ identity: value(52), identityVersion: 52, dossierVersion: 53,
      history: [revision(2, value(2), value(1)), revision(1, value(1))] }));
    fireEvent.click(screen.getByRole("button", { name: "Voir les versions précédentes" }));
    await screen.findByRole("heading", { name: "Version du dossier 1" });
    expect(screen.getByRole("heading", { name: "Version du dossier 52" })).toBeInTheDocument();
    expect(lireIdentiteSecurisee).toHaveBeenLastCalledWith({ caseId, beforeVersion: 3 });
    expect(within(screen.getByRole("region", { name: "Identité actuelle" })).getByText("FICTIF-52")).toBeInTheDocument();
  });
  it("un double clic n'envoie qu'une modification et une confirmation tardive ne recharge pas un autre dossier", async () => {
    const view = renderPanel(); await edit(); let resolve;
    modifierIdentiteSecurisee.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const button = screen.getByRole("button", { name: "Enregistrer l’identité" }); fireEvent.click(button); fireEvent.click(button);
    expect(modifierIdentiteSecurisee).toHaveBeenCalledTimes(1);
    view.rerender(<MemoryRouter><SecureCaseIdentityPanel key="autre" caseId={actorId} /></MemoryRouter>);
    resolve({ caseId, dossierVersion: 2 });
    await waitFor(() => expect(screen.queryByText(/Identité enregistrée/)).not.toBeInTheDocument());
    expect(lireIdentiteSecurisee).toHaveBeenCalledTimes(1);
  });
});
