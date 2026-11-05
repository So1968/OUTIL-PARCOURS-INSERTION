import { describe, expect, it } from "vitest";
import { InvalidTaskDraft, prepareSecureTaskCreate } from "./secureTaskCreation";

describe("création de tâches en une saisie", () => {
  it("garde le titre seul en version express sans inventer de date", () => {
    expect(prepareSecureTaskCreate("  Relance fictive  ")).toEqual({title:"Relance fictive"});
    expect(prepareSecureTaskCreate("Préparer un échange", {
      dueDate:"", reminderDaysBefore:1, estimatedMinutes:"",
    })).toEqual({title:"Préparer un échange"});
  });

  it("transmet en un POST échéance, rappel et estimation explicites", () => {
    expect(prepareSecureTaskCreate("Contacter un partenaire", {
      dueDate:"2026-11-13", reminderDaysBefore:2, estimatedMinutes:20,
    })).toEqual({
      title:"Contacter un partenaire", dueDate:"2026-11-13",
      reminderDaysBefore:2, estimatedMinutes:20,
    });
    expect(prepareSecureTaskCreate("Envoyer un document", {
      estimatedMinutes:15,
    })).toEqual({title:"Envoyer un document",estimatedMinutes:15});
  });

  it("refuse échéances impossibles et valeurs non autorisées", () => {
    for (const options of [
      {dueDate:"2026-02-30"},
      {dueDate:"2026-13-01"},
      {dueDate:"2026-11-05", reminderDaysBefore:3},
      {dueDate:"2026-11-05",reminderDaysBefore:"1"},
      {estimatedMinutes:0},
      {estimatedMinutes:601},
      {estimatedMinutes:"30"},
      {ownerId:"fictif"},
    ]) {
      expect(() => prepareSecureTaskCreate("Test fictif", options))
        .toThrow(InvalidTaskDraft);
    }
    expect(() => prepareSecureTaskCreate("  ", {})).toThrow(InvalidTaskDraft);
    expect(() => prepareSecureTaskCreate("A".repeat(201), {})).toThrow(InvalidTaskDraft);
  });

  it("ne change jamais les paramètres passés", () => {
    const options = Object.freeze({dueDate:"2026-11-13",reminderDaysBefore:7});
    expect(prepareSecureTaskCreate("Réponse fictive", options).dueDate).toBe("2026-11-13");
    expect(options).toEqual({dueDate:"2026-11-13",reminderDaysBefore:7});
  });
});
