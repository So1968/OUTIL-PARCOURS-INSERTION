import { describe, expect, it } from "vitest";
import { calculerChargeJour, dureeLisible, isDate, minutesValides, TYPES_EVENEMENTS } from "./workload";

const day = "2026-10-26";
describe("plan de charge quotidien", () => {
  it("calcule séparément tâches, imprévus déjà réalisés, RDV et blocages", () => {
    const data = calculerChargeJour({
      day, capacityMinutes: 360,
      tasks: [
        { id:"a", dueDate:"2026-10-25", estimatedMinutes:40, status:"À faire" },
        { id:"b", dueDate:day, estimatedMinutes:20, status:"En cours" },
        { id:"c", dueDate:day, estimatedMinutes:50, status:"Fait" },
        { id:"d", dueDate:"", estimatedMinutes:70, status:"À faire" },
      ],
      events: [
        { day, type:"Imprévu", status:"Fait", minutes:15 },
        { day, type:"Relance", status:"À faire", minutes:10 },
        { day:"2026-10-27", type:"Appel", status:"Fait", minutes:25 },
      ],
      appointments: [
        { date:day, durationMinutes:45, statut:"Confirmé" },
        { date:day, durationMinutes:90, statut:"Annulé" },
      ],
    });
    expect(data).toMatchObject({
      totalKnown:130, margin:230, overload:false,
      taskMinutes:60, doneMinutes:15, plannedMinutes:10, meetingMinutes:45,
      dueCount:1, overdueCount:1, pendingWithoutDate:1, appointmentsCount:1,
      missingEstimates:0,
    });
  });
  it("ne transforme jamais une durée absente en durée réelle", () => {
    const d = calculerChargeJour({
      day, capacityMinutes:60,
      tasks:[{ dueDate:day, status:"À faire" }],
      events:[{ day, status:"À faire", minutes:"" }],
      appointments:[{ date:day, statut:"À confirmer" }],
    });
    expect(d.totalKnown).toBe(0);
    expect(d.missingEstimates).toBe(3);
  });
  it("signale une surcharge et n'efface pas les tâches en retard", () => {
    const d = calculerChargeJour({
      day, capacityMinutes:120,
      tasks:[{ dueDate:"2026-10-01", estimatedMinutes:180, status:"À faire" }],
    });
    expect(d.overload).toBe(true);
    expect(d.margin).toBe(-60);
    expect(d.overdueCount).toBe(1);
  });
  it("valide les dates/durées sans accepter les valeurs implicites", () => {
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate(day)).toBe(true);
    expect(minutesValides("")).toBeNull();
    expect(minutesValides(0)).toBeNull();
    expect(minutesValides("30")).toBe(30);
    expect(minutesValides(1200)).toBeNull();
    expect(dureeLisible(135)).toBe("2 h 15");
    expect(TYPES_EVENEMENTS["Imprévu"]).toBe(15);
  });
});
