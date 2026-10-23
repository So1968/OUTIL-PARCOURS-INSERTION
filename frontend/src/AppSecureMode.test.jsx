import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./lib/secureTasksApi", () => ({
  secureTaskApiEnabled: () => true,
}));

import App from "./App";

afterEach(() => cleanup());

describe("isolation du mode serveur professionnel", () => {
  it("n'expose ni la file locale ni le sélecteur de profils du prototype", () => {
    localStorage.setItem("artag-pilotage-actions-rows-v1", JSON.stringify([
      { Nom: "FICTIF", Prénom: "Exemple", "Numéro Insertis": "123456" },
    ]));
    render(<MemoryRouter initialEntries={["/pilotage-actions"]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", {
      name: "Module non activé en mode professionnel sécurisé",
    })).toBeInTheDocument();
    expect(screen.queryByLabelText("Changer de profil")).not.toBeInTheDocument();
    expect(screen.queryByText("Exemple")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "File active" })).not.toBeInTheDocument();
  });
});
