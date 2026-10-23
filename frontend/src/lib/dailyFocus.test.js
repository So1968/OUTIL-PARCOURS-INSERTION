import { describe, it, expect } from "vitest";
import { troisPriorites, progressionTaches, actionsMaintenant, retrouverTacheEnCours } from "./dailyFocus";

describe("trois priorités sans score et sans données personnelles", () => {
  it("sélectionne priorités explicites, retards et échéances aujourd'hui", () => {
    const items = [
      { id:"c", title:"Plus tard", status:"À faire", dueDate:"2026-11-10" },
      { id:"a", title:"Échue", status:"À faire", dueDate:"2026-10-22" },
      { id:"b", title:"Aujourd'hui", status:"En cours", dueDate:"2026-10-23" },
      { id:"d", title:"Choisie", status:"À faire", dueDate:"", priority:"haute" },
      { id:"e", title:"Fait", status:"Fait", dueDate:"2026-10-20" },
    ];
    expect(troisPriorites(items, "2026-10-23").map(t => t.id)).toEqual(["d","a","b"]);
    expect(items).toHaveLength(5);
  });
  it("ne fait remonter aucune tâche terminée et ne fabrique pas de date", () => {
    expect(troisPriorites([{ id:"f", status:"Fait" }], "2026-10-23")).toEqual([]);
    expect(troisPriorites([{ id:"a", status:"À faire", dueDate:"" }], "2026-10-23")[0].dueDate).toBe("");
    expect(troisPriorites([{ id:"a" }], "date-invalide")).toEqual([]);
  });
  it("affiche une progression d'organisation sans notation individuelle", () => {
    expect(progressionTaches([
      { id:"a", status:"Fait" }, { id:"b", status:"À faire" }, { id:"c", status:"En cours" },
    ])).toEqual({done:1, remaining:2});
  });
  it("réunit retards, échéances et rappels dans une liste sans doublons", () => {
    const tasks = [
      { id:"due", dossierId:"a", dueDate:"2026-10-23", status:"À faire", reminderDaysBefore:1, estimatedMinutes:45 },
      { id:"old", dossierId:"b", dueDate:"2026-10-20", status:"À faire", reminderDaysBefore:1 },
      { id:"due", dossierId:"a", dueDate:"2026-10-23", status:"À faire", reminderDaysBefore:1, estimatedMinutes:45 },
      { id:"future", dossierId:"x", dueDate:"2026-11-01", status:"À faire", reminderDaysBefore:7 },
      { id:"near", dossierId:"b", dueDate:"2026-10-24", status:"À faire", reminderDaysBefore:1, estimatedMinutes:5 },
      { id:"done", dossierId:"c", dueDate:"2026-10-21", status:"Fait" },
      { id:"snoozed", dossierId:"c", dueDate:"2026-10-22", status:"À faire", snoozedUntil:"2026-10-25" },
      { id:"undated", dossierId:"d", dueDate:"", status:"À faire" },
    ];
    expect(actionsMaintenant(tasks, "2026-10-23").map(t => t.id)).toEqual(["old","due","near"]);
    expect(actionsMaintenant(tasks, "2026-02-30")).toEqual([]);
  });

  it("priorise la durée courte à urgence et échéance égales", () => {
    const tasks = [
      { id:"slow", dueDate:"2026-10-23", estimatedMinutes:60, status:"À faire" },
      { id:"fast", dueDate:"2026-10-23", estimatedMinutes:10, status:"À faire" },
    ];
    expect(actionsMaintenant(tasks, "2026-10-23").map(t => t.id)).toEqual(["fast","slow"]);
  });

  it("ne reprend une tâche que si son identifiant correspond et si elle reste ouverte", () => {
    const tasks = [
      { id:"one", dossierId:"a", title:"Tâche fictive", status:"À faire" },
      { id:"two", dossierId:"b", title:"Terminé", status:"Fait" },
    ];
    expect(retrouverTacheEnCours(tasks, { dossierId:"a", taskId:"one" })?.id).toBe("one");
    expect(retrouverTacheEnCours(tasks, { dossierId:"b", taskId:"two" })).toBeNull();
    expect(retrouverTacheEnCours(tasks, { dossierId:"a", taskId:"other" })).toBeNull();
  });

});
