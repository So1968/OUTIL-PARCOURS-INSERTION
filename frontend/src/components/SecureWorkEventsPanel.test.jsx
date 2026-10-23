import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  loadSecureTasks: vi.fn(),
  loadSecureWorkEvents: vi.fn(),
  createSecureWorkEvent: vi.fn(),
  editSecureWorkEvent: vi.fn(),
}));
vi.mock("../lib/secureTasksApi", () => api);
import { SecureWorkEventsPanel } from "./SecureWorkEventsPanel";

describe("bureau privé : saisie rapide et reprise sans doublon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.loadSecureTasks.mockResolvedValue([]);
    api.loadSecureWorkEvents.mockResolvedValue({ day:"2026-10-23", events:[] });
    api.createSecureWorkEvent.mockResolvedValue({});
    api.editSecureWorkEvent.mockResolvedValue({});
    vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000001" });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("saisit un imprévu en un clic sans données de bénéficiaire ni stockage local", async () => {
    const spy = vi.spyOn(Storage.prototype, "getItem");
    render(<SecureWorkEventsPanel />);
    const button = await screen.findByRole("button", { name:"+ Imprévu · 15 min" });
    fireEvent.click(button);
    await waitFor(() => expect(api.createSecureWorkEvent).toHaveBeenCalledTimes(1));
    const input = api.createSecureWorkEvent.mock.calls[0][0];
    expect(input).toEqual({
      requestId:"00000000-0000-4000-8000-000000000001",
      day:"2026-10-23", kind:"IMPREVU", state:"EFFECTUE", minutes:15,
    });
    expect(Object.hasOwn(input, "title")).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("en cas de coupure, réessaie avec la même clé de requête", async () => {
    api.createSecureWorkEvent
      .mockRejectedValueOnce(new Error("Coupure réseau"))
      .mockResolvedValueOnce({});
    render(<SecureWorkEventsPanel />);
    fireEvent.click(await screen.findByRole("button", { name:"+ Appel · 10 min" }));
    const retry = await screen.findByRole("button", { name:"Réessayer sans créer de doublon" });
    fireEvent.click(retry);
    await waitFor(() => expect(api.createSecureWorkEvent).toHaveBeenCalledTimes(2));
    expect(api.createSecureWorkEvent.mock.calls[0][0])
      .toEqual(api.createSecureWorkEvent.mock.calls[1][0]);
  });

  it("n'affiche pas les activités annulées dans la charge connue", async () => {
    api.loadSecureWorkEvents.mockResolvedValue({
      day:"2026-10-23",
      events:[
        { id:"e1", day:"2026-10-23", kind:"APPEL", state:"EFFECTUE", minutes:10, version:0 },
        { id:"e2", day:"2026-10-23", kind:"IMPREVU", state:"ANNULE", minutes:60, version:1 },
      ],
    });
    render(<SecureWorkEventsPanel />);
    expect(await screen.findByText(/10 min de charge connue/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name:"Activités enregistrées (1)" })).toBeInTheDocument();
  });
});
