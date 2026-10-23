import { describe, expect, it } from "vitest";
import { syntheseChargePrivee, chargeToText } from "./secureWorkload";

describe("charge privée basée uniquement sur les données du serveur", () => {
  it("additionne tâches en retard, événements effectués et prévus sans compter les annulations", () => {
    const result = syntheseChargePrivee({
      day: "2026-10-23",
      tasks: [
        { status:"A_FAIRE", dueDate:"2026-10-22", estimatedMinutes:20 },
        { status:"EN_COURS", dueDate:"2026-10-23", estimatedMinutes:40 },
        { status:"FAIT", dueDate:"2026-10-20", estimatedMinutes:60 },
        { status:"A_FAIRE", dueDate:"2026-11-01", estimatedMinutes:60 },
        { status:"A_FAIRE", dueDate:"2026-10-23", estimatedMinutes:null },
      ],
      events: [
        { day:"2026-10-23", state:"EFFECTUE", minutes:15 },
        { day:"2026-10-23", state:"PREVU", minutes:30 },
        { day:"2026-10-23", state:"ANNULE", minutes:90 },
        { day:"2026-10-24", state:"EFFECTUE", minutes:100 },
      ],
    });
    expect(result).toMatchObject({
      totalKnown:105, taskMinutes:60, doneMinutes:15, plannedMinutes:30,
      overdue:1, due:3, unestimatedTasks:1, plannedEvents:1, completedEvents:1,
    });
    expect(chargeToText(result.totalKnown)).toBe("1 h 45");
  });
  it("ne fabrique aucune durée lorsqu'une estimation est absente", () => {
    expect(syntheseChargePrivee({
      day:"2026-10-23",
      tasks:[{ dueDate:"2026-10-23", status:"A_FAIRE" }],
    }).totalKnown).toBe(0);
    expect(() => syntheseChargePrivee({ day:"jour-non-valide" })).toThrow();
  });
});
