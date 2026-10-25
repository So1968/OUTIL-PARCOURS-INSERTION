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

const toutesLesActions = ["Avec une personne", "File active", "Mes tâches", "Continuité"];

describe("hiérarchie de navigation du prototype", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("préserve tous les accès existants dans deux niveaux lisibles", () => {
    renderNavigation();

    expect(labels("Espaces principaux")).toEqual([
      "Accueil", "Parcours", "Accompagnement",
    ]);
    expect(labels("Accès rapides")).toEqual(toutesLesActions);
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

  it.each([
    ["professionnelle", ["Accueil", "Parcours", "Accompagnement"], toutesLesActions],
    ["professionnelle-appui-tns", ["Accueil", "Accompagnement"], toutesLesActions],
    ["accueil", ["Accueil"], ["Continuité"]],
    ["relais-logement-habitat", ["Accueil"], ["Continuité"]],
    ["direction", ["Accueil", "Direction"], ["Continuité"]],
    ["gouvernance-ca", ["Accueil", "Direction"], []],
    ["administrateur", ["Accueil", "Parcours", "Accompagnement", "Direction"], toutesLesActions],
    ["mode-demonstration", ["Accueil", "Parcours", "Accompagnement", "Direction"], toutesLesActions],
  ])("respecte les accès du profil %s", (role, espacesAttendus, rapidesAttendus) => {
    renderNavigation({ role });

    expect(labels("Espaces principaux")).toEqual(espacesAttendus);
    if (rapidesAttendus.length === 0) {
      expect(screen.queryByRole("group", { name: "Accès rapides" })).not.toBeInTheDocument();
    } else {
      expect(labels("Accès rapides")).toEqual(rapidesAttendus);
    }
  });

  it("signale la route active même lorsqu'elle est dans les accès rapides", () => {
    renderNavigation({ path: "/pilotage-actions" });
    expect(screen.getByRole("link", { name: "File active" }))
      .toHaveAttribute("aria-current", "page");
  });

  it("conserve le repère actif sur les sous-pages de parcours", () => {
    renderNavigation({ path: "/parcours-social-socio-professionnel/dossier" });
    expect(screen.getByRole("link", { name: "Parcours" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Accueil" }))
      .not.toHaveAttribute("aria-current", "page");
  });
});
