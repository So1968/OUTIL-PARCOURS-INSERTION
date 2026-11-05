import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecureCaseReferencePanel } from "./SecureCaseReferencePanel";
import { ApiAccessError, lireReferenceArtagSecurisee, corrigerReferenceArtagSecurisee } from "../lib/secureApi";
vi.mock("../lib/secureApi", async original => ({ ...await original(),
  lireReferenceArtagSecurisee: vi.fn(), corrigerReferenceArtagSecurisee: vi.fn(),
}));
const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const initial = "ARTAG-FICTIF-A", proposal = "ARTAG-FICTIF-C";
const revision = (version = 1, value = initial, previous = null) => ({ dossierVersion: version,
  artagReference: value, previousReference: previous, actorId, reason: "Vérification fictive", createdAt: "2026-10-26T10:00:00Z" });
const page = overrides => ({ caseId, artagReference: initial, dossierVersion: 2,
  history: [revision()], nextBeforeVersion: null, ...overrides });
const renderPanel = () => render(<MemoryRouter><SecureCaseReferencePanel caseId={caseId} /></MemoryRouter>);
const load = async () => { fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" })); await screen.findByRole("region", { name: "Référence actuelle" }); };
const edit = async () => {
  await load(); fireEvent.click(screen.getByRole("button", { name: "Corriger le numéro ARTAG" }));
  fireEvent.change(screen.getByLabelText("Nouveau numéro ARTAG"), { target: { value: proposal } });
  fireEvent.change(screen.getByLabelText("Motif de correction"), { target: { value: "Correction fictive vérifiée" } });
};
const save = () => fireEvent.click(screen.getByRole("button", { name: "Enregistrer la correction" }));
beforeEach(() => { vi.resetAllMocks(); lireReferenceArtagSecurisee.mockResolvedValue(page());
  corrigerReferenceArtagSecurisee.mockResolvedValue({ caseId, artagReference: proposal, dossierVersion: 3 }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("correction sécurisée du numéro ARTAG", () => {
  it("attend le serveur avant d'ouvrir la correction et n'utilise pas le stockage du navigateur", async () => {
    const reads = vi.spyOn(Storage.prototype, "getItem"), writes = vi.spyOn(Storage.prototype, "setItem");
    renderPanel(); expect(lireReferenceArtagSecurisee).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Corriger le numéro ARTAG" })).not.toBeInTheDocument();
    await load();
    expect(screen.getByRole("link", { name: "Ouvrir les notes partagées" })).toHaveAttribute("href", `/dossiers/${caseId}/notes-partagees`);
    expect(screen.queryByText(caseId)).not.toBeInTheDocument();
    expect(reads).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
  });
  it("enregistre exactement la saisie avec motif et version, puis montre les anciennes valeurs", async () => {
    renderPanel(); await edit();
    lireReferenceArtagSecurisee.mockResolvedValue(page({ artagReference: proposal, dossierVersion: 3,
      history: [revision(3, proposal, initial), revision()] }));
    save();
    await screen.findByText("Numéro ARTAG corrigé. La valeur précédente reste dans l’historique.");
    expect(corrigerReferenceArtagSecurisee).toHaveBeenCalledExactlyOnceWith({ caseId, artagReference: proposal,
      reason: "Correction fictive vérifiée", expectedVersion: 2 });
    expect(screen.getByRole("heading", { name: `Numéro ARTAG : ${proposal}` })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Version du dossier 1" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
  });
  it("ne corrige ni une valeur identique ni une valeur invalide et exige un motif", async () => {
    renderPanel(); await load(); fireEvent.click(screen.getByRole("button", { name: "Corriger le numéro ARTAG" }));
    const saveButton = screen.getByRole("button", { name: "Enregistrer la correction" });
    expect(saveButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motif de correction"), { target: { value: "Vérification fictive" } });
    for (const value of [initial, "", " ARTAG-FICTIF", "x".repeat(81), "\ud800"]) {
      fireEvent.change(screen.getByLabelText("Nouveau numéro ARTAG"), { target: { value } });
      expect(saveButton).toBeDisabled();
    }
    fireEvent.change(screen.getByLabelText("Nouveau numéro ARTAG"), { target: { value: "🧪".repeat(80) } });
    expect(saveButton).toBeEnabled();
    expect(corrigerReferenceArtagSecurisee).not.toHaveBeenCalled();
  });
  it("une référence absente ne permet aucune attribution depuis cet écran", async () => {
    lireReferenceArtagSecurisee.mockResolvedValue(page({ artagReference: null, history: [] }));
    renderPanel(); await load();
    expect(screen.getByRole("heading", { name: "Numéro ARTAG non renseigné" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corriger le numéro ARTAG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ouvrir les notes partagées" })).not.toBeInTheDocument();
  });
  it.each([401, 403, 404])("efface la référence, l'historique et la saisie après un refus d'accès %s", async status => {
    renderPanel(); await edit();
    corrigerReferenceArtagSecurisee.mockRejectedValue(new ApiAccessError(status)); save();
    await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Historique du numéro ARTAG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Référence actuelle" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
  });
  it("garde la saisie en conflit et exige une recharge puis une reprise explicite", async () => {
    renderPanel(); await edit();
    corrigerReferenceArtagSecurisee.mockRejectedValueOnce(new ApiAccessError(409, "DOSSIER_MODIFIE_ENTRE_TEMPS")); save();
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Nouveau numéro ARTAG")).toHaveValue(proposal);
    expect(screen.getByRole("button", { name: "Continuer après relecture" })).toBeDisabled();
    lireReferenceArtagSecurisee.mockResolvedValue(page({ dossierVersion: 4 }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger la référence" }));
    await screen.findByText("Référence actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    corrigerReferenceArtagSecurisee.mockResolvedValue({ caseId, artagReference: proposal, dossierVersion: 5 }); save();
    await waitFor(() => expect(corrigerReferenceArtagSecurisee).toHaveBeenCalledTimes(2));
    expect(corrigerReferenceArtagSecurisee).toHaveBeenLastCalledWith(expect.objectContaining({ expectedVersion: 4 }));
  });
  it("une recharge volontaire pendant la saisie ne remplace pas silencieusement sa version attendue", async () => {
    renderPanel(); await edit();
    fireEvent.click(screen.getByRole("button", { name: "Recharger la référence" }));
    await screen.findByText("Référence actuelle rechargée. Relisez-la avant de reprendre votre saisie.");
    expect(screen.getByLabelText("Nouveau numéro ARTAG")).toHaveValue(proposal);
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    expect(corrigerReferenceArtagSecurisee).not.toHaveBeenCalled();
  });
  it("ne renvoie pas une correction incertaine et permet de constater qu'elle est déjà enregistrée", async () => {
    renderPanel(); await edit(); corrigerReferenceArtagSecurisee.mockRejectedValue(new TypeError("Réponse fictivement perdue")); save();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    lireReferenceArtagSecurisee.mockResolvedValue(page({ artagReference: proposal, dossierVersion: 3,
      history: [revision(3, proposal, initial), revision()] }));
    fireEvent.click(screen.getByRole("button", { name: "Recharger la référence" }));
    await screen.findByRole("heading", { name: `Numéro ARTAG : ${proposal}` });
    fireEvent.click(screen.getByRole("button", { name: "Continuer après relecture" }));
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Abandonner la saisie" }));
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
    expect(corrigerReferenceArtagSecurisee).toHaveBeenCalledTimes(1);
  });
  it("un succès suivi d'une lecture refusée reste enregistré et efface tout contenu ancien", async () => {
    renderPanel(); await edit(); lireReferenceArtagSecurisee.mockRejectedValue(new ApiAccessError(404)); save();
    await screen.findByText("Numéro ARTAG corrigé. Rechargez pour actualiser l’affichage ; aucun nouvel enregistrement n’est nécessaire.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Référence actuelle" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
    expect(corrigerReferenceArtagSecurisee).toHaveBeenCalledTimes(1);
  });
  it("n'annonce pas de succès si la réponse de correction concerne un autre dossier", async () => {
    renderPanel(); await edit(); corrigerReferenceArtagSecurisee.mockResolvedValue({ caseId: actorId, artagReference: proposal, dossierVersion: 3 }); save();
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Nouveau numéro ARTAG")).toHaveValue(proposal);
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
  });
  it("ne dévoile aucun autre dossier lors d'une collision de référence", async () => {
    renderPanel(); await edit(); corrigerReferenceArtagSecurisee.mockRejectedValue(new ApiAccessError(409, "REFERENCE_INDISPONIBLE")); save();
    expect(await screen.findByRole("alert")).toHaveTextContent("Ce numéro ne peut pas être utilisé. Vérifiez le numéro saisi.");
    expect(screen.getByLabelText("Nouveau numéro ARTAG")).toHaveValue(proposal);
    expect(corrigerReferenceArtagSecurisee).toHaveBeenCalledTimes(1);
  });
  it("bloque un historique signalé incohérent et conserve la saisie sans nouvel envoi", async () => {
    renderPanel(); await edit(); corrigerReferenceArtagSecurisee.mockRejectedValue(new ApiAccessError(409, "HISTORIQUE_REFERENCE_INDISPONIBLE")); save();
    expect(await screen.findByRole("alert")).toHaveTextContent("L’historique du numéro ARTAG doit être vérifié");
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Historique du numéro ARTAG" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" }));
    expect(await screen.findByLabelText("Nouveau numéro ARTAG")).toHaveValue(proposal);
    expect(screen.getByRole("button", { name: "Enregistrer la correction" })).toBeDisabled();
  });
  it("refuse les réponses incomplètes, étrangères, désordonnées ou dont la chaîne de références est incohérente", async () => {
    for (const response of [{}, page({ caseId: actorId }), page({ dossierVersion: -1 }),
      page({ history: [revision(1, "AUTRE-FICTIF")] }), page({ history: [revision(), revision()] }),
      page({ history: [revision(2, initial, "LIEN-FICTIF"), revision(1, "MAUVAIS-LIEN-FICTIF")] }),
      page({ nextBeforeVersion: 1 })]) {
      lireReferenceArtagSecurisee.mockResolvedValueOnce(response);
      const view = renderPanel();
      fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" }));
      await screen.findByRole("alert");
      expect(screen.queryByRole("button", { name: "Corriger le numéro ARTAG" })).not.toBeInTheDocument();
      view.unmount();
    }
  });
  it("montre la valeur antérieure exacte même si elle était mal formatée avant cette API", async () => {
    lireReferenceArtagSecurisee.mockResolvedValue(page({ history: [revision(1, initial, " ANCIEN-FICTIF ")] }));
    renderPanel(); await load();
    expect(within(screen.getByRole("region", { name: "Historique du numéro ARTAG" })).getByText("ANCIEN-FICTIF")).toBeInTheDocument();
  });
  it("pagine l'historique sans perdre les versions déjà affichées", async () => {
    const histories = Array.from({ length: 50 }, (_, i) => revision(52 - i, `FICTIF-${52 - i}`, `FICTIF-${51 - i}`));
    lireReferenceArtagSecurisee.mockResolvedValueOnce(page({ dossierVersion: 52, artagReference: "FICTIF-52", history: histories, nextBeforeVersion: 3 }));
    renderPanel(); await load();
    lireReferenceArtagSecurisee.mockResolvedValueOnce(page({ dossierVersion: 52, artagReference: "FICTIF-52",
      history: [revision(2, "FICTIF-2", "FICTIF-1"), revision(1, "FICTIF-1")] }));
    fireEvent.click(screen.getByRole("button", { name: "Voir les versions précédentes" }));
    await screen.findByRole("heading", { name: "Version du dossier 1" });
    expect(lireReferenceArtagSecurisee).toHaveBeenLastCalledWith({ caseId, beforeVersion: 3 });
    expect(screen.getByRole("heading", { name: "Version du dossier 52" })).toBeInTheDocument();
  });
  it("refuse de mélanger les pages après une correction concurrente", async () => {
    const histories = Array.from({ length: 50 }, (_, i) => revision(52 - i, `FICTIF-${52 - i}`, `FICTIF-${51 - i}`));
    lireReferenceArtagSecurisee.mockResolvedValueOnce(page({ dossierVersion: 52, artagReference: "FICTIF-52", history: histories, nextBeforeVersion: 3 }));
    renderPanel(); await load();
    lireReferenceArtagSecurisee.mockResolvedValueOnce(page({ dossierVersion: 53, artagReference: "FICTIF-CONCURRENT",
      history: [revision(2, "FICTIF-2", "FICTIF-1"), revision(1, "FICTIF-1")] }));
    fireEvent.click(screen.getByRole("button", { name: "Voir les versions précédentes" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Version du dossier 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corriger le numéro ARTAG" })).toBeDisabled();
  });
  it("ne transmet qu'une correction tant que sa réponse est en attente", async () => {
    renderPanel(); await edit();
    let resolve;
    corrigerReferenceArtagSecurisee.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    save(); save();
    expect(corrigerReferenceArtagSecurisee).toHaveBeenCalledTimes(1);
    resolve({ caseId, artagReference: proposal, dossierVersion: 3 });
    await screen.findByRole("status");
  });
  it("empêche les doubles clics et ignore la réponse après démontage", async () => {
    let resolve;
    lireReferenceArtagSecurisee.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const view = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" }));
    fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" }));
    expect(lireReferenceArtagSecurisee).toHaveBeenCalledTimes(1);
    view.unmount(); resolve(page());
    await waitFor(() => expect(screen.queryByText(`Numéro ARTAG : ${initial}`)).not.toBeInTheDocument());
  });
  it("une confirmation tardive du dossier précédent ne recharge ni ne modifie le nouvel écran", async () => {
    const view = renderPanel(); await edit();
    let resolve;
    corrigerReferenceArtagSecurisee.mockReturnValueOnce(new Promise(done => { resolve = done; })); save();
    view.rerender(<MemoryRouter><SecureCaseReferencePanel key="autre" caseId={actorId} /></MemoryRouter>);
    resolve({ caseId, artagReference: proposal, dossierVersion: 3 });
    await waitFor(() => expect(screen.queryByText(/Numéro ARTAG corrigé/)).not.toBeInTheDocument());
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
    expect(lireReferenceArtagSecurisee).toHaveBeenCalledTimes(1);
  });
});
