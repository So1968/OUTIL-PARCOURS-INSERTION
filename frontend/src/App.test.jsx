import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("navigation principale", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("présente l’accueil de travail et le logo ARTAG", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Qu’est-ce que je fais maintenant ?" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "ARTAG" })).toHaveAttribute("src", "/logo-artag.png");
    expect(screen.getByRole("link", { name: /Ouvrir la file active/ })).toHaveAttribute("href", "/pilotage-actions");
  });

  it("refuse une page professionnelle au profil accueil", async () => {
    localStorage.setItem("artag-prototype-current-role", "accueil");
    renderApp("/pilotage-actions");

    expect(await screen.findByRole("heading", { name: "Cet espace n’est pas ouvert à ce profil." })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Profil actif : Accueil");
  });

  it("adapte les accès visibles quand le profil change", () => {
    renderApp();

    fireEvent.change(screen.getByLabelText("Changer de profil"), { target: { value: "direction" } });

    expect(screen.getAllByRole("link", { name: "Direction" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "File active" })).not.toBeInTheDocument();
  });

  it("conserve la compatibilité des anciennes routes Appui TNS", async () => {
    renderApp("/appui-tns/fiche-minute");

    expect(await screen.findByRole("heading", { name: "Fiche minute après contact" })).toBeInTheDocument();
  });
});
