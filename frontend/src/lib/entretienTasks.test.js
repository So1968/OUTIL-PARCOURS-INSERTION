import { describe, expect, it, vi } from "vitest";
import { preparerTachesEntretien, repartitionTaches, previsualiserRappelCalendrier } from "./entretienTasks";

describe("tâches après entretien", () => {
  it("liste chaque suite explicitement mentionnée sans inventer d'action", () => {
    vi.stubGlobal("crypto", { randomUUID: (() => { let n = 0; return () => "t" + (++n); })() });
    expect(preparerTachesEntretien("- Relancer la CMA\n- Préparer le CER\n3. Vérifier les documents")).toMatchObject([
      { title: "Relancer la CMA", status: "À faire", dueDate: "", outlookStatus: "Non synchronisé" },
      { title: "Préparer le CER" },
      { title: "Vérifier les documents" },
    ]);
    vi.unstubAllGlobals();
  });
  it("déduplique sans supprimer les anciennes tâches", () => {
    const previous = [{ id:"a", title:"Préparer le CER", status:"En cours" }];
    expect(preparerTachesEntretien("Préparer le CER\nContacter le partenaire", previous).map(t=>t.title))
      .toEqual(["Contacter le partenaire"]);
    expect(previous).toHaveLength(1);
  });
  it("identifie les échéances et les tâches terminées", () => {
    const tasks = [
      { id:"a", status:"À faire", dueDate:"2026-10-21" },
      { id:"b", status:"À faire", dueDate:"2026-10-22" },
      { id:"c", status:"À faire", dueDate:"2026-11-02" },
      { id:"d", status:"Fait", dueDate:"2026-10-21" },
    ];
    const result = repartitionTaches(tasks, "2026-10-22");
    expect(result.overdue.map(t=>t.id)).toEqual(["a"]);
    expect(result.today.map(t=>t.id)).toEqual(["b"]);
    expect(result.upcoming.map(t=>t.id)).toEqual(["c"]);
    expect(result.done.map(t=>t.id)).toEqual(["d"]);
  });
  it("ne prépare aucun rappel sans date et n'exporte aucun texte d'entretien", () => {
    expect(previsualiserRappelCalendrier({ title:"Note privée" })).toBeNull();
    const event = previsualiserRappelCalendrier({
      title:"Information très sensible", dueDate:"2026-11-20", reminderDaysBefore:7,
    });
    expect(event).toEqual({ subject:"Action de suivi professionnel", dueDate:"2026-11-20", reminderDaysBefore:7, requiresAuthorizedConnector:true });
    expect(JSON.stringify(event)).not.toContain("sensible");
  });
});
