import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SaisieRapide } from "./SaisieRapide";
import { TASKS_STORAGE_KEY } from "../lib/followupTasks";

describe("saisie rapide du bureau professionnel", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("enregistre un imprévu en une phrase avec Entrée, sans fiche complète", () => {
    const onSaved = vi.fn();
    render(<SaisieRapide onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText("Qu'est-ce qu'il faut garder en mémoire ?"), {
      target: { value: "Rappeler un partenaire" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Noter/ }).closest("form"));
    const stored = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      eventType: "imprevu", title: "Rappeler un partenaire",
      priority: "haute", outlookStatus: "non_connecte",
    });
    expect(stored[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(onSaved).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Qu'est-ce qu'il faut garder en mémoire ?")).toHaveValue("");
  });

  it("permet une date et une heure explicites pour un rendez-vous à organiser", () => {
    render(<SaisieRapide />);
    fireEvent.click(screen.getByRole("button", { name: "Rendez-vous à organiser" }));
    fireEvent.click(screen.getByRole("button", { name: "Changer date / heure" }));
    fireEvent.change(screen.getByLabelText("Qu'est-ce qu'il faut garder en mémoire ?"), {
      target: { value: "Prévoir un point de suivi" },
    });
    fireEvent.change(screen.getByLabelText("Date à traiter"), { target: { value: "2026-11-10" } });
    fireEvent.change(screen.getByLabelText("Heure (facultative)"), { target: { value: "09:30" } });
    fireEvent.submit(screen.getByRole("button", { name: /Noter/ }).closest("form"));
    expect(JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY))[0]).toMatchObject({
      eventType: "rendez_vous", eventTime: "09:30", dueDate: "2026-11-10",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Noté dans Mes tâches");
  });

  it("signale l'échec du stockage sans prétendre avoir enregistré", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("stockage refusé"); });
    render(<SaisieRapide />);
    fireEvent.change(screen.getByLabelText("Qu'est-ce qu'il faut garder en mémoire ?"), {
      target: { value: "Action de démonstration" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Noter/ }).closest("form"));
    expect(screen.getByRole("status")).toHaveTextContent("Enregistrement impossible");
    expect(screen.getByLabelText("Qu'est-ce qu'il faut garder en mémoire ?")).toHaveValue("Action de démonstration");
  });
});
