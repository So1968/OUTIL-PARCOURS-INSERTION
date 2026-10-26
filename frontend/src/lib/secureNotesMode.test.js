import { afterEach, describe, expect, it, vi } from "vitest";
import { secureNotesApiEnabled, secureNotesModeRequested } from "./secureNotesMode";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("activation explicite du module notes", () => {
  it.each([["0", "https:", false], ["1", "http:", false], ["1", "https:", true]])(
    "activation %s en %s : %s", (flag, protocol, enabled) => {
      vi.stubEnv("VITE_ARTAG_SECURE_NOTES", flag);
      vi.stubGlobal("window", { location: { protocol } });
      expect(secureNotesModeRequested()).toBe(flag === "1");
      expect(secureNotesApiEnabled()).toBe(enabled);
    },
  );
});
