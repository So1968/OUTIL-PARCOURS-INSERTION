import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({ notes: true, requested: true, tasks: false }));
vi.mock("./lib/secureNotesMode", () => ({
  secureNotesApiEnabled: () => flags.notes, secureNotesModeRequested: () => flags.requested,
}));
vi.mock("./lib/secureTasksApi", () => ({ secureTaskApiEnabled: () => flags.tasks }));
import App from "./App";

const first = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const second = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const path = id => `/dossiers/${id}/notes-partagees`;
function ChangeCase() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(path(second))}>Autre dossier fictif</button>;
}
function ChangeReferenceCase() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(`/dossiers/${second}/reference-artag`)}>Autre référence fictive</button>;
}

beforeEach(() => {
  flags.notes = true; flags.requested = true; flags.tasks = false;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
    dossierVersion: 0, notes: [], nextOffset: null,
  }))));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("route des notes professionnelles", () => {
  it("ouvre l'identification depuis la file, corrige puis retrouve le numéro rechargé dans les notes", async () => {
    const stamp = "2026-10-26T10:00:00Z";
    let reference = "ARTAG-FICTIF-A", version = 0, history = [];
    fetch.mockImplementation(async (url, options = {}) => {
      if (url === "/auth/csrf") return new Response(JSON.stringify({ token: "a".repeat(64) }));
      if (options.method === "PATCH") {
        const body = JSON.parse(options.body);
        expect(body).toEqual({ expectedVersion: 0, artagReference: "ARTAG-FICTIF-C", reason: "Correction fictive" });
        history = [{ dossierVersion: 1, previousReference: reference, artagReference: body.artagReference,
          actorId: second, reason: body.reason, createdAt: stamp }];
        reference = body.artagReference; version = 1;
        return new Response(JSON.stringify({ caseId: first, artagReference: reference, dossierVersion: version }));
      }
      return new Response(JSON.stringify(url === "/api/mes-dossiers" ? {
        cases: [{ id: first, artagReference: reference, version, createdAt: stamp, updatedAt: stamp, canManageReference: true }], nextCursor: null,
      } : url.endsWith("/reference-artag") ? { caseId: first, artagReference: reference, dossierVersion: version, history, nextBeforeVersion: null }
        : { dossierVersion: version, artagReference: reference, notes: [], nextOffset: null }));
    });
    const reads = vi.spyOn(Storage.prototype, "getItem"), writes = vi.spyOn(Storage.prototype, "setItem");
    render(<MemoryRouter initialEntries={["/dossiers"]}><App /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Charger ma file active" }));
    fireEvent.click(await screen.findByRole("link", { name: "Numéro ARTAG et historique" }));
    await screen.findByRole("heading", { name: "Identité / références" });
    fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" }));
    fireEvent.click(await screen.findByRole("button", { name: "Corriger le numéro ARTAG" }));
    fireEvent.change(screen.getByLabelText("Nouveau numéro ARTAG"), { target: { value: "ARTAG-FICTIF-C" } });
    fireEvent.change(screen.getByLabelText("Motif de correction"), { target: { value: "Correction fictive" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer la correction" }));
    await screen.findByText("Numéro ARTAG corrigé. La valeur précédente reste dans l’historique.");
    fireEvent.click(screen.getByRole("link", { name: "Retour à la file active" }));
    fireEvent.click(await screen.findByRole("button", { name: "Charger ma file active" }));
    await screen.findByRole("heading", { name: "Numéro ARTAG : ARTAG-FICTIF-C" });
    fireEvent.click(screen.getByRole("link", { name: "Ouvrir les notes partagées" }));
    fireEvent.click(await screen.findByRole("button", { name: "Charger les notes partagées" }));
    await screen.findByRole("heading", { name: "Numéro ARTAG : ARTAG-FICTIF-C" });
    expect(reads).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
  });
  it("détruit la saisie d'identification en changeant de dossier et ferme cette route hors module", async () => {
    fetch.mockImplementation(async url => new Response(JSON.stringify({
      caseId: url.includes(second) ? second : first, artagReference: "ARTAG-FICTIF", dossierVersion: 0, history: [], nextBeforeVersion: null,
    })));
    const view = render(<MemoryRouter initialEntries={[`/dossiers/${first}/reference-artag`]}><ChangeReferenceCase /><App /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Charger la référence et l’historique" }));
    fireEvent.click(await screen.findByRole("button", { name: "Corriger le numéro ARTAG" }));
    fireEvent.change(screen.getByLabelText("Nouveau numéro ARTAG"), { target: { value: "SAISIE-FICTIVE-PREMIER-DOSSIER" } });
    fireEvent.click(screen.getByRole("button", { name: "Autre référence fictive" }));
    expect(screen.queryByLabelText("Nouveau numéro ARTAG")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Charger la référence et l’historique" }));
    fireEvent.click(await screen.findByRole("button", { name: "Corriger le numéro ARTAG" }));
    expect(screen.getByLabelText("Nouveau numéro ARTAG")).toHaveValue("ARTAG-FICTIF");
    expect(fetch).toHaveBeenLastCalledWith(`/api/dossiers/${second}/reference-artag`, expect.any(Object));
    view.unmount(); flags.notes = false; flags.requested = false; flags.tasks = true;
    render(<MemoryRouter initialEntries={[`/dossiers/${first}/reference-artag`]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Module non activé en mode professionnel sécurisé" })).toBeInTheDocument();
  });
  it("refuse un identifiant arbitraire sur la route d'identification sans requête", async () => {
    render(<MemoryRouter initialEntries={["/dossiers/invalide/reference-artag"]}><App /></MemoryRouter>);
    await screen.findByRole("heading", { name: "Dossier indisponible" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("relie le bureau à la file active puis aux notes du dossier choisi", async () => {
    const stamp = "2026-10-26T08:00:00Z";
    fetch.mockImplementation(async url => new Response(JSON.stringify(url === "/api/mes-dossiers" ? {
      cases: [{ id: first, artagReference: "ARTAG-FICTIF", version: 0, createdAt: stamp, updatedAt: stamp, canManageReference: true }], nextCursor: null,
    } : { dossierVersion: 0, artagReference: "ARTAG-FICTIF", notes: [], nextOffset: null })));
    const read = vi.spyOn(Storage.prototype, "getItem");
    render(<MemoryRouter initialEntries={["/bureau-quotidien"]}><App /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("link", { name: "Ouvrir ma file active" }));
    await screen.findByRole("heading", { name: "File active" });
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Charger ma file active" }));
    fireEvent.click(await screen.findByRole("link", { name: "Ouvrir les notes partagées" }));
    await screen.findByRole("heading", { name: "Notes partagées" });
    fireEvent.click(screen.getByRole("button", { name: "Charger les notes partagées" }));
    await screen.findByLabelText("Texte de la note");
    expect(screen.getByRole("heading", { name: "Numéro ARTAG : ARTAG-FICTIF" })).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(`/api/dossiers/${first}/notes-partagees?offset=0`, expect.any(Object));
    expect(read).not.toHaveBeenCalled();
  });
  it("ouvre le module seul sans monter les écrans locaux ni le sélecteur de rôle", async () => {
    const read = vi.spyOn(Storage.prototype, "getItem");
    const write = vi.spyOn(Storage.prototype, "setItem");
    render(<MemoryRouter initialEntries={[path(first)]}><App /></MemoryRouter>);
    await screen.findByRole("heading", { name: "Notes partagées" });
    expect(screen.queryByLabelText("Changer de profil")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Charger les notes partagées" }));
    await screen.findByLabelText("Texte de la note");
    expect(fetch).toHaveBeenCalledWith(`/api/dossiers/${first}/notes-partagees?offset=0`, expect.objectContaining({ credentials: "same-origin" }));
    expect(read).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
  });

  it("un changement de dossier détruit la saisie du dossier précédent", async () => {
    render(<MemoryRouter initialEntries={[path(first)]}><ChangeCase /><App /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Charger les notes partagées" }));
    fireEvent.change(await screen.findByLabelText("Texte de la note"), { target: { value: "Brouillon fictif du premier dossier" } });
    fireEvent.click(screen.getByRole("button", { name: "Autre dossier fictif" }));
    expect(screen.queryByLabelText("Texte de la note")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Charger les notes partagées" }));
    expect(await screen.findByLabelText("Texte de la note")).toHaveValue("");
    expect(fetch).toHaveBeenLastCalledWith(`/api/dossiers/${second}/notes-partagees?offset=0`, expect.any(Object));
  });

  it("refuse un dossier arbitraire sans requête", async () => {
    render(<MemoryRouter initialEntries={[path("invalide")]}><App /></MemoryRouter>);
    await screen.findByRole("heading", { name: "Dossier indisponible" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("en HTTP, un module demandé reste fermé sans revenir au prototype", () => {
    flags.notes = false;
    const read = vi.spyOn(Storage.prototype, "getItem");
    render(<MemoryRouter initialEntries={[path(first)]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Connexion HTTPS requise" })).toBeInTheDocument();
    expect(read).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  it("les tâches seules n'activent pas les notes et le mode notes ferme les écrans historiques", () => {
    flags.notes = false; flags.requested = false; flags.tasks = true;
    const view = render(<MemoryRouter initialEntries={[path(first)]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Module non activé en mode professionnel sécurisé" })).toBeInTheDocument();
    view.unmount();
    flags.notes = true; flags.requested = true; flags.tasks = false;
    render(<MemoryRouter initialEntries={["/pilotage-actions"]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Module non activé en mode professionnel sécurisé" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
