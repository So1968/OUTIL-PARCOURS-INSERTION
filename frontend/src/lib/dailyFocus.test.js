import { describe, it, expect } from "vitest";
import { troisPriorites, progressionTaches } from "./dailyFocus";

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
});
