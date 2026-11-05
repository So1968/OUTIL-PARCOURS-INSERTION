import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const state = vi.hoisted(() => ({ secure: false, notes: false }));
vi.mock("../lib/secureTasksApi", () => ({
  secureTaskApiEnabled: () => state.secure,
}));
vi.mock("../lib/secureNotesMode", () => ({ secureNotesApiEnabled: () => state.notes }));
vi.mock("../components/SecureTasksPanel", () => ({
  SecureTasksPanel: () => <p>VOLET_SERVEUR_FICTIF</p>,
}));
vi.mock("../components/SecureWorkEventsPanel", () => ({
  SecureWorkEventsPanel: () => <p>CHARGE_SERVEUR_FICTIVE</p>,
}));
import { BureauTravailRoute } from "./BureauTravailRoute";

describe("séparation du bureau démo / tâches privées", () => {
  beforeEach(() => {
    state.secure = false;
    state.notes = false;
    localStorage.clear();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it("garde le mode démonstration sur le site local", () => {
    render(<MemoryRouter><BureauTravailRoute /></MemoryRouter>);
    expect(screen.getByRole("heading", { name:"Plan de charge du jour" })).toBeInTheDocument();
    expect(screen.queryByText("VOLET_SERVEUR_FICTIF")).not.toBeInTheDocument();
    expect(screen.queryByText("CHARGE_SERVEUR_FICTIVE")).not.toBeInTheDocument();
  });
  it("en mode serveur, ne monte aucun composant lisant les tâches locales", () => {
    localStorage.setItem("artag-taches-entretien-demo-v1", JSON.stringify({
      demo: [{ id:"local-secret", title:"NE_PAS_AFFICHER", status:"À faire" }],
    }));
    state.secure = true;
    const spy = vi.spyOn(Storage.prototype, "getItem");
    render(<MemoryRouter><BureauTravailRoute /></MemoryRouter>);
    expect(screen.getByRole("heading", { name:"Mon bureau professionnel protégé" })).toBeInTheDocument();
    expect(screen.getByText("VOLET_SERVEUR_FICTIF")).toBeInTheDocument();
    expect(screen.getByText("CHARGE_SERVEUR_FICTIVE")).toBeInTheDocument();
    expect(screen.queryByText("NE_PAS_AFFICHER")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name:"Plan de charge du jour" })).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
  it("le module notes seul ne monte ni le prototype ni les tâches désactivées", () => {
    state.notes = true;
    const spy = vi.spyOn(Storage.prototype, "getItem");
    render(<MemoryRouter><BureauTravailRoute /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Mon bureau professionnel protégé" })).toBeInTheDocument();
    expect(screen.queryByText("VOLET_SERVEUR_FICTIF")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Plan de charge du jour" })).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
