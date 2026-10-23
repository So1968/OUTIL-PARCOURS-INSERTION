import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  secureTaskApiEnabled, loadSecureTasks, loadSecureReminders, nextProfessionalDay,
  createSecureTask, editSecureTask, loadSecureWorkEvents,
  createSecureWorkEvent, editSecureWorkEvent,
  SecureTasksUnavailable,
} from "./secureTasksApi";

describe("tâches serveur : aucune activation implicite", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ARTAG_SECURE_TASKS", "0");
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reste fermé et ne fait aucune requête réseau dans le prototype", async () => {
    expect(secureTaskApiEnabled()).toBe(false);
    await expect(loadSecureTasks()).rejects.toBeInstanceOf(SecureTasksUnavailable);
    await expect(loadSecureReminders()).rejects.toBeInstanceOf(SecureTasksUnavailable);
    await expect(loadSecureWorkEvents()).rejects.toBeInstanceOf(SecureTasksUnavailable);
    await expect(createSecureWorkEvent({
      requestId: "fictif", day:"2026-10-23", kind:"APPEL", minutes:10, state:"EFFECTUE",
    })).rejects.toBeInstanceOf(SecureTasksUnavailable);
    await expect(editSecureWorkEvent({ id:"fake", version:0 }, { state:"ANNULE" }))
      .rejects.toBeInstanceOf(SecureTasksUnavailable);
    await expect(createSecureTask("Action fictive")).rejects.toBeInstanceOf(SecureTasksUnavailable);
    await expect(editSecureTask({ id:"fictif", version:0 }, { status:"FAIT" }))
      .rejects.toBeInstanceOf(SecureTasksUnavailable);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("un drapeau frontend seul ne suffit pas sans un hébergement HTTPS", async () => {
    vi.stubEnv("VITE_ARTAG_SECURE_TASKS", "1");
    if (window.location.protocol !== "https:") {
      expect(secureTaskApiEnabled()).toBe(false);
      await expect(loadSecureTasks()).rejects.toBeInstanceOf(SecureTasksUnavailable);
      expect(fetch).not.toHaveBeenCalled();
    }
  });
  it("reporte au prochain jour civil, même lors du changement d'heure", () => {
    expect(nextProfessionalDay("2026-10-25")).toBe("2026-10-26");
    expect(nextProfessionalDay("2026-03-28")).toBe("2026-03-29");
    expect(() => nextProfessionalDay("2026-02-30")).toThrow(SecureTasksUnavailable);
  });

});
