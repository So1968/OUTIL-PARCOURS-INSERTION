import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RendezVousSuiviPage } from "./RendezVousSuiviPage";

describe("rappels de rendez-vous : vérification de l'accord", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("ne présume jamais l'accord et bloque les liens d'envoi par défaut", () => {
    render(<MemoryRouter><RendezVousSuiviPage /></MemoryRouter>);

    expect(screen.getByLabelText("Accord pour rappel")).toHaveValue("À demander");
    expect(screen.queryByRole("link", { name: "Ouvrir SMS J-7" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ouvrir SMS J-2" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Accord requis pour l’envoi")).toHaveLength(2);
  });

  it("n'ouvre les liens d'envoi qu'après sélection explicite de Oui", () => {
    render(<MemoryRouter><RendezVousSuiviPage /></MemoryRouter>);

    const accord = screen.getByLabelText("Accord pour rappel");
    fireEvent.change(accord, { target: { value: "Oui" } });
    expect(screen.getByRole("link", { name: "Ouvrir SMS J-7" })).toHaveAttribute("href");
    expect(screen.getByRole("link", { name: "Ouvrir SMS J-2" })).toHaveAttribute("href");

    fireEvent.change(accord, { target: { value: "Non" } });
    expect(screen.queryByRole("link", { name: "Ouvrir SMS J-7" })).not.toBeInTheDocument();
  });
});
