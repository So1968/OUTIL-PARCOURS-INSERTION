import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BureauQuotidienPage } from "./BureauQuotidienPage";

const workDay = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
};
const renderBoard = () => render(<MemoryRouter><BureauQuotidienPage /></MemoryRouter>);

describe("bureau de charge et saisie express (démonstration)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", { randomUUID: () => "id-fictif" });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("note un imprévu en un clic, estime sa charge et permet de l'annuler", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /Imprévu.*15 min/ }));
    const saved = JSON.parse(localStorage.getItem("artag-evenements-express-demo-v1"));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ type:"Imprévu", minutes:15, status:"Fait", day:workDay() });
    expect(screen.getByText("15 min", { selector:"strong" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name:"Annuler la dernière saisie" }));
    expect(JSON.parse(localStorage.getItem("artag-evenements-express-demo-v1"))).toHaveLength(0);
  });

  it("permet de consigner un rendez-vous rapide comme charge à venir", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /RDV à venir.*30 min/ }));
    const saved = JSON.parse(localStorage.getItem("artag-evenements-express-demo-v1"));
    expect(saved[0]).toMatchObject({ type:"Rendez-vous", minutes:30, status:"À faire" });
    expect(screen.getByText(/Événements prévus : 30 min/)).toBeInTheDocument();
  });

  it("n'affiche pas le prénom d'un rendez-vous dans le plan de charge", () => {
    localStorage.setItem("artag-rendez-vous-suivi", JSON.stringify([
      { id:"r1", date:workDay(), prenom:"NE_PAS_AFFICHER", durationMinutes:45, statut:"À confirmer" },
    ]));
    renderBoard();
    expect(screen.getByText(/Rendez-vous enregistrés : 45 min/)).toBeInTheDocument();
    expect(screen.queryByText("NE_PAS_AFFICHER")).not.toBeInTheDocument();
  });

  it("ajoute une tâche en une saisie sans date inventée, puis permet de l'échelonner", () => {
    renderBoard();
    fireEvent.change(screen.getByPlaceholderText("Ex. Relancer la réponse d'un partenaire"), {
      target: { value: "Relance fictive" },
    });
    fireEvent.click(screen.getByRole("button", { name:"Ajouter à ma liste" }));
    const saved = JSON.parse(localStorage.getItem("artag-taches-entretien-demo-v1"));
    expect(saved.__mes_taches).toMatchObject([
      { title:"Relance fictive", status:"À faire", dueDate:"", reminderDaysBefore:1 },
    ]);
    expect(screen.getByText(/tâche\(s\) sans échéance/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name:"Ouvrir le dossier" })).not.toBeInTheDocument();
  });

  it("affiche les rappels dont la date est arrivée et les reporte en un geste", () => {
    localStorage.setItem("artag-taches-entretien-demo-v1", JSON.stringify({
      "dossier-fictif": [{
        id:"t1", title:"Relance échéance fictive",
        dueDate:workDay(), reminderDaysBefore:1, status:"À faire",
      }],
    }));
    renderBoard();
    expect(screen.getByRole("heading", { name:"Mes rappels à traiter (1)" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name:"Reporter au lendemain" })[0]);
    const stored = JSON.parse(localStorage.getItem("artag-taches-entretien-demo-v1"));
    expect(stored["dossier-fictif"][0].dueDate).not.toBe(workDay());
    expect(stored["dossier-fictif"][0].status).toBe("À faire");
  });

  it("signale les tâches sans temps estimé plutôt que de fabriquer une durée", () => {
    localStorage.setItem("artag-taches-entretien-demo-v1", JSON.stringify({
      "dossier-demo": [{ id:"t1", title:"Relance fictive", dueDate:workDay(), status:"À faire" }],
    }));
    renderBoard();
    expect(screen.getByText(/1 élément\(s\) sans durée/)).toBeInTheDocument();
  });
});
