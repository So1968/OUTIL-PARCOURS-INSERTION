import { describe, expect, it } from "vitest";
import { secureDailyPriorities, secureTaskCounts } from "./secureDailyPriorities";

describe("trois priorités professionnelles sans données de démonstration", () => {
  it("privilégie tâche en cours, retards et échéances du jour sans modifier l'entrée", () => {
    const tasks = [
      { id: "later", status:"A_FAIRE", dueDate:"2026-12-01" },
      { id: "today", status:"A_FAIRE", dueDate:"2026-11-05" },
      { id: "done", status:"FAIT", dueDate:"2026-11-01" },
      { id: "overdue", status:"EN_ATTENTE", dueDate:"2026-11-03" },
      { id: "active", status:"EN_COURS", dueDate:null },
      { id: "undated", status:"A_FAIRE", dueDate:null },
    ];
    expect(secureDailyPriorities(tasks,"2026-11-05").map(t=>t.id)).toEqual(["active","overdue","today"]);
    expect(tasks[0].id).toBe("later");
  });
  it("n'invente pas de dates et affiche des totaux non évaluatifs", () => {
    expect(secureDailyPriorities([{id:"x",status:"A_FAIRE",dueDate:null}],"2026-11-05")).toHaveLength(1);
    expect(secureDailyPriorities([{id:"x",status:"A_FAIRE"}],"invalide")).toEqual([]);
    expect(secureTaskCounts([{id:"one",status:"A_FAIRE"},{id:"two",status:"FAIT"}],[{},{}]))
      .toEqual({open:1,reminders:2});
  });
});
