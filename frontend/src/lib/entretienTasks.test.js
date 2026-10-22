import { describe, expect, it, vi } from "vitest";
import { preparerTachesEntretien, genererTachesApresEntretien, jourDeRappel, rappelsProfessionnels, repartitionTaches, previsualiserRappelCalendrier } from "./entretienTasks";

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
  it("transforme la clôture d'entretien en tâches exhaustives, sans reprendre les notes réservées", () => {
    let n = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `fictif-${++n}` });
    const first = genererTachesApresEntretien({
      journalId:"journal-fictif",
      suitePrevue:"- Relancer la CMA\n2. Préparer le CER",
      prochaineAction:"Préparer le CER; Vérifier une échéance",
      analyse:"NOTE_RESERVEE_NE_PAS_AJOUTER",
      parolePersonne:"PAROLE_PRIVEE_NE_PAS_AJOUTER",
    });
    expect(first.added).toBe(4);
    expect(first.tasks.map(t => t.title)).toEqual([
      "Relancer la CMA", "Préparer le CER", "Vérifier une échéance",
      "Tracer l’entretien dans Insertis",
    ]);
    expect(JSON.stringify(first.tasks)).not.toContain("NE_PAS_AJOUTER");
    expect(first.tasks.every(t => t.dueDate === "" && t.status === "À faire")).toBe(true);

    const again = genererTachesApresEntretien({
      journalId:"journal-fictif",
      suitePrevue:"Relancer la CMA\nPréparer le CER\nContacter le partenaire",
      previous:first.tasks,
    });
    expect(again.added).toBe(1);
    expect(again.tasks[0].id).toBe(first.tasks[0].id);
    expect(again.tasks.at(-1).title).toBe("Contacter le partenaire");

    const nextInterview = genererTachesApresEntretien({
      journalId:"autre-entretien", suitePrevue:"Relancer la CMA",
      traceInsertis:"Faite", previous:again.tasks,
    });
    expect(nextInterview.added).toBe(1);
    vi.unstubAllGlobals();
  });

  it("ne signale que les rappels échus, sans inventer de dates ou notifier les tâches terminées", () => {
    expect(jourDeRappel("2026-03-30", 1)).toBe("2026-03-29");
    expect(jourDeRappel("2026-02-30", 1)).toBe("");
    expect(jourDeRappel("", 1)).toBe("");
    const tasks = [
      { id:"a", title:"Fictif", dueDate:"2026-10-30", reminderDaysBefore:7, status:"À faire" },
      { id:"b", title:"Fictif", dueDate:"2026-10-30", reminderDaysBefore:1, status:"À faire" },
      { id:"c", dueDate:"2026-10-22", reminderDaysBefore:7, status:"Fait" },
      { id:"d", dueDate:"", status:"À faire" },
    ];
    expect(rappelsProfessionnels(tasks, "2026-10-23").map(t => t.id)).toEqual(["a"]);
    expect(rappelsProfessionnels(tasks, "2026-10-29").map(t => t.id)).toEqual(["a","b"]);
    expect(rappelsProfessionnels(tasks, "2026-02-30")).toEqual([]);
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
