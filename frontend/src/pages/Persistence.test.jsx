import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DossierPage } from "./DossierPage";
import { TnsFicheMinutePage } from "./TnsFicheMinutePage";
import { LectureGlobaleOptimiseePage } from "./LectureGlobaleOptimiseePage";
import { SocleAutonomiePage } from "./SocleAutonomiePage";
import { EvaluationPersonnePage } from "./EvaluationPersonnePage";

describe("confirmation des sauvegardes du prototype", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it.each([
    [DossierPage, "Valider le parcours", "Parcours non enregistré"],
    [TnsFicheMinutePage, "Enregistrer localement", "Fiche non enregistrée"],
    [LectureGlobaleOptimiseePage, "Enregistrer", "Lecture globale non enregistrée"],
    [SocleAutonomiePage, /Enregistrer/, "Repères non enregistrés"],
  ])("ne confirme pas une sauvegarde refusée (%#)", (Page, button, message) => {
    render(<MemoryRouter><Page /></MemoryRouter>);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota dépassé", "QuotaExceededError");
    });
    fireEvent.click(screen.getAllByRole("button", { name: button })[0]);
    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  it("conserve un parcours validé après remontage", () => {
    const mount = () => render(<MemoryRouter><DossierPage /></MemoryRouter>);
    const view = mount();
    fireEvent.click(screen.getByRole("button", { name: "Valider le parcours" }));
    const saved = JSON.parse(localStorage.getItem("artag-dossier-parcours-brouillon"));
    expect(saved.derniereMiseAJour).toBeTruthy();
    view.unmount();
    mount();
    expect(screen.getByDisplayValue(saved.derniereMiseAJour)).toBeInTheDocument();
  });

  it("ne compte pas une réponse refusée comme enregistrée", () => {
    localStorage.setItem("artag-pilotage-actions-rows-v1", JSON.stringify([
      { "Numéro Insertis": "FICTIF-1", Nom: "FICTIF", Prénom: "Exemple" },
    ]));
    render(<MemoryRouter initialEntries={["/evaluation/FICTIF-1"]}>
      <Routes><Route path="/evaluation/:dossierId" element={<EvaluationPersonnePage />} /></Routes>
    </MemoryRouter>);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota"); });
    fireEvent.click(screen.getAllByRole("button", { name: "Je me débrouille seul(e)" })[0]);
    expect(screen.getByText(/Réponse non enregistrée/)).toBeInTheDocument();
    expect(localStorage.getItem("artag-pilotage-autonomie-socle-v1")).toBeNull();
  });

  it.each([
    [TnsFicheMinutePage, "artag-accompagnement-global-fiche-minute-test"],
    [LectureGlobaleOptimiseePage, "artag-lecture-globale-optimisee-v1"],
  ])("ne confirme pas un effacement refusé (%#)", (Page, key) => {
    const saved = JSON.stringify({ faits: "Situation fictive" });
    localStorage.setItem(key, saved);
    render(<MemoryRouter><Page /></MemoryRouter>);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("Accès refusé"); });
    fireEvent.click(screen.getByRole("button", { name: /Remettre à zéro/ }));
    expect(screen.getByText(/non effacée/)).toBeInTheDocument();
    expect(localStorage.getItem(key)).toBe(saved);
  });
});
