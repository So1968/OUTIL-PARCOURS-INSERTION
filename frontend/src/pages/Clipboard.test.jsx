import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TnsFicheMinutePage } from "./TnsFicheMinutePage";
import { LectureGlobaleOptimiseePage } from "./LectureGlobaleOptimiseePage";
import { CadreOrientationPage } from "./CadreOrientationPage";
import { DossierPage } from "./DossierPage";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const cases = [
  [TnsFicheMinutePage, "Copier Insertis"],
  [LectureGlobaleOptimiseePage, "Copier Insertis"],
  [CadreOrientationPage, "Copier la phrase"],
  [DossierPage, "Copier la synthèse"],
];

describe("confirmation de copie", () => {
  it.each(cases)("signale un refus du navigateur (%#)", async (Page, button) => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Refus")) } });
    render(<MemoryRouter><Page /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(await screen.findByText(/Copie impossible/)).toBeInTheDocument();
  });

  it("attend la copie avant de la confirmer", async () => {
    let resolve;
    vi.stubGlobal("navigator", { clipboard: { writeText: () => new Promise(done => { resolve = done; }) } });
    render(<MemoryRouter><TnsFicheMinutePage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Copier Insertis" }));
    expect(screen.queryByText("Version Insertis copié.")).not.toBeInTheDocument();
    resolve();
    await waitFor(() => expect(screen.getByText("Version Insertis copié.")).toBeInTheDocument());
  });

  it("propose la copie manuelle quand l'API est absente", async () => {
    vi.stubGlobal("navigator", {});
    render(<MemoryRouter><CadreOrientationPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Copier la phrase" }));
    expect(await screen.findByText(/Copie impossible/)).toBeInTheDocument();
  });
});
