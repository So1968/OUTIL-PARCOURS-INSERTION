import { describe, expect, it } from "vitest";
import { classeEcheance, creerTachesEntretien, decomposeActions, rappelsDuJour, shiftLocalDate, todayLocal } from "./followupTasks";

const now = new Date(2026, 9, 22, 15, 30);

describe("tâches après entretien — données fictives", () => {
  it("crée une tâche par démarche et une trace Insertis du jour", () => {
    const result = creerTachesEntretien({
      dossierId: "DEMO-123", journalId: "rdv-1",
      suitePrevue: "- Contacter la CMA\n- Vérifier une formation; Préparer le CV",
      echeance: "2026-10-27", now,
    });
    expect(result.added).toBe(4);
    expect(result.tasks.map(x => x.title)).toEqual([
      "Contacter la CMA", "Vérifier une formation", "Préparer le CV",
      "Tracer l'entretien dans Insertis",
    ]);
    expect(result.tasks[0].dueDate).toBe("2026-10-27");
    expect(result.tasks[0].remindDate).toBe("2026-10-26");
    expect(result.tasks[3]).toMatchObject({ priority: "haute", dueDate: "2026-10-22" });
  });

  it("ne crée pas une deuxième fois des actions pour le même entretien", () => {
    const first = creerTachesEntretien({ dossierId: "d1", journalId: "e1", suitePrevue: "Relancer", now });
    const again = creerTachesEntretien({
      dossierId: "d1", journalId: "e1", suitePrevue: "Relancer", now,
      existingTasks: first.tasks,
    });
    expect(again.added).toBe(0);
    expect(again.tasks).toHaveLength(2);
  });

  it("sans action saisie, conserve au moins la trace Insertis à effectuer", () => {
    const { tasks } = creerTachesEntretien({ dossierId: "d", journalId: "e", now });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain("Insertis");
  });

  it("supprime les répétitions et les listes numérotées", () => {
    expect(decomposeActions("1. Relancer la CMA\n- relancer la cma\n2) Compléter dossier"))
      .toEqual(["Relancer la CMA", "Compléter dossier"]);
  });

  it("distingue retard, aujourd'hui, semaine et terminé", () => {
    expect(classeEcheance({ dueDate: "2026-10-21", status: "a_faire" }, "2026-10-22")).toBe("retard");
    expect(classeEcheance({ dueDate: "2026-10-22", status: "a_faire" }, "2026-10-22")).toBe("aujourdhui");
    expect(classeEcheance({ dueDate: "2026-10-24", status: "a_faire" }, "2026-10-22")).toBe("semaine");
    expect(classeEcheance({ dueDate: "2026-10-20", status: "fait" }, "2026-10-22")).toBe("fait");
    expect(rappelsDuJour([{ status: "fait", dueDate: "2026-10-20" },
      { status: "a_faire", dueDate: "2026-10-25", remindDate: "2026-10-22" }], "2026-10-22")).toHaveLength(1);
  });

  it("gère les dates locales sans décalage UTC", () => {
    expect(todayLocal(now)).toBe("2026-10-22");
    expect(shiftLocalDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});
