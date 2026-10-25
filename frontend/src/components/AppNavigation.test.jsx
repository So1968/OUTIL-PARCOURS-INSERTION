import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RoleProvider } from "../auth/RoleContext";
import { AppNavigation } from "./AppNavigation";

function renderNavigation({ role = "professionnelle", path = "/" } = {}) {
  localStorage.setItem("artag-prototype-current-role", role);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RoleProvider>
        <AppNavigation />
      </RoleProvider>
    </MemoryRouter>,
  );
}

function labels(groupName) {
  return within(screen.getByRole("group", { name: groupName }))
    .getAllByRole("link")
    .map((link) => link.textContent);
}

describe("hiérarchie de navigation du prototype", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("préserve tous les accès existants dans deux niveaux lisibles", () => {
    renderNavigation();

    expect(labels("Espaces principaux")).toEqual([
      "Accueil", "Parcours", "Accompagnement",
    ]);
    expect(labels("Accès rapides")).toEqual([
      "Avec une personne", "File active", "Mes tâches", "Continuité",
    ]);
    expect(screen.getByRole("link", { name: "Parcours" }))
      .toHaveAttribute("href", "/parcours-social-socio-professionnel");
    expect(screen.getByRole("link", { name: "Mes tâches" }))
      .toHaveAttribute("href", "/bureau-quotidien");
    expect(screen.queryByRole("link", { name: "Direction" })).not.toBeInTheDocument();
  });

  it("n'affiche à l'accueil que la continuité et l'accueil", () => {
    renderNavigation({ role: "accueil" });

    expect(labels("Espaces principaux")).toEqual(["Accueil"]);
    expect(labels("Accès rapides")).toEqual(["Continuité"]);
    expect(screen.queryByRole("link", { name: "File active" })).not.toBeInTheDocument();
  });

  it("garde la séparation entre direction et accompagnement", () => {
    renderNavigation({ role: "direction" });

    expect(labels("Espaces principaux")).toEqual(["Accueil", "Direction"]);
    expect(labels("Accès rapides")).toEqual(["Continuité"]);
    expect(screen.queryByRole("link", { name: "Parcours" })).not.toBeInTheDocument();
  });

  it("signale la route active même lorsqu'elle est dans les accès rapides", () => {
    renderNavigation({ path: "/pilotage-actions" });
    expect(screen.getByRole("link", { name: "File active" }))
      .toHaveAttribute("aria-current", "page");
  });
});
