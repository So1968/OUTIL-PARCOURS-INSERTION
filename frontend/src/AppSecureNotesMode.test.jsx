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

beforeEach(() => {
  flags.notes = true; flags.requested = true; flags.tasks = false;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
    dossierVersion: 0, notes: [], nextOffset: null,
  }))));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("route des notes professionnelles", () => {
  it("relie le bureau à la file active puis aux notes du dossier choisi", async () => {
    const stamp = "2026-10-26T08:00:00Z";
    fetch.mockImplementation(async url => new Response(JSON.stringify(url === "/api/mes-dossiers" ? {
      cases: [{ id: first, artagReference: "ARTAG-FICTIF", version: 0, createdAt: stamp, updatedAt: stamp }], nextCursor: null,
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
