import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  secureTaskApiEnabled: vi.fn(() => true),
  loadSecureTasks: vi.fn(), loadSecureReminders: vi.fn(),
  createSecureTask: vi.fn(), editSecureTask: vi.fn(),
  nextProfessionalDay: vi.fn(() => "2026-11-06"),
}));
vi.mock("../lib/secureTasksApi", () => api);
import { SecureTasksPanel } from "./SecureTasksPanel";

const sample = () => [
  { id:"a", title:"Dossier fictif à poursuivre", status:"EN_COURS", dueDate:"2026-11-09", version:0,
    estimatedMinutes:null, reminderDaysBefore:1 },
  { id:"b", title:"Relance administrative fictive", status:"A_FAIRE", dueDate:"2026-11-04", version:0,
    estimatedMinutes:null, reminderDaysBefore:1 },
  { id:"c", title:"Préparer un bilan fictif", status:"A_FAIRE", dueDate:"2026-11-05", version:0,
    estimatedMinutes:null, reminderDaysBefore:1 },
  { id:"d", title:"Action future fictive", status:"A_FAIRE", dueDate:null, version:0,
    estimatedMinutes:null, reminderDaysBefore:1 },
];

describe("bureau professionnel sans stockage local", () => {
  beforeEach(() => {
    vi.clearAllMocks(); localStorage.clear();
    api.secureTaskApiEnabled.mockReturnValue(true);
    api.loadSecureTasks.mockResolvedValue(sample());
    api.loadSecureReminders.mockResolvedValue({ day:"2026-11-05", reminders:[] });
    api.editSecureTask.mockImplementation(async (task, changes) => ({
      ...task, ...changes, version:task.version+1,
    }));
  });
  afterEach(() => cleanup());

  it("charge les priorités automatiquement depuis les API et garde trois actions utiles", async () => {
    localStorage.setItem("artag-taches-entretien-demo-v1", JSON.stringify({
      secret: [{ title:"NE_PAS_AFFICHER" }],
    }));
    const readSpy=vi.spyOn(Storage.prototype,"getItem");
    render(<SecureTasksPanel focus={false} onToggleFocus={vi.fn()} />);
    expect(await screen.findByRole("heading",{name:"Mes 3 priorités du jour"})).toBeInTheDocument();
    expect(screen.queryByText("NE_PAS_AFFICHER")).not.toBeInTheDocument();
    expect(screen.getByText("À reprendre :")).toBeInTheDocument();
    expect(screen.getAllByRole("button",{name:"Terminer"})).toHaveLength(3);
    expect(screen.getAllByRole("button",{name:"Reporter le rappel"})).toHaveLength(3);
    expect(readSpy).not.toHaveBeenCalled();
    readSpy.mockRestore();
  });

  it("commencer une tâche met EN_COURS côté serveur et active le Focus", async () => {
    const onToggleFocus=vi.fn();
    render(<SecureTasksPanel focus={false} onToggleFocus={onToggleFocus} />);
    await screen.findByRole("heading",{name:"Mes 3 priorités du jour"});
    fireEvent.click(screen.getAllByRole("button",{name:"Commencer"})[0]);
    await waitFor(() => expect(api.editSecureTask).toHaveBeenCalledWith(
      expect.objectContaining({id:"b"}), {status:"EN_COURS"}
    ));
    expect(onToggleFocus).toHaveBeenCalledOnce();
  });

  it("annule sur le serveur une fin de tâche avec le bon numéro de version", async () => {
    render(<SecureTasksPanel focus={false} onToggleFocus={vi.fn()} />);
    await screen.findByRole("heading",{name:"Mes 3 priorités du jour"});
    fireEvent.click(screen.getAllByRole("button",{name:"Terminer"})[0]);
    await waitFor(() => expect(api.editSecureTask).toHaveBeenCalledWith(
      expect.objectContaining({id:"a",version:0}), {status:"FAIT"}
    ));
    fireEvent.click(screen.getByRole("button",{name:"Annuler la dernière modification de tâche"}));
    await waitFor(() => expect(api.editSecureTask).toHaveBeenCalledWith(
      expect.objectContaining({id:"a",version:1}), {status:"EN_COURS"}
    ));
    expect(await screen.findByText("Dernière modification annulée sur le serveur.")).toBeInTheDocument();
  });

  it("vide immédiatement les tâches visibles si le serveur refuse les droits", async () => {
    render(<SecureTasksPanel focus={false} onToggleFocus={vi.fn()} />);
    await screen.findByRole("heading",{name:"Mes 3 priorités du jour"});
    api.editSecureTask.mockRejectedValueOnce(Object.assign(new Error("Autorisation refusée."),{status:403}));
    fireEvent.click(screen.getAllByRole("button",{name:"Terminer"})[0]);
    expect(await screen.findByText(/Accès professionnel indisponible/)).toBeInTheDocument();
    expect(screen.queryByText("Dossier fictif à poursuivre")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading",{name:"Mes 3 priorités du jour"})).not.toBeInTheDocument();
  });

  it("en Focus masque les réglages longs, mais garde rappels et création", async () => {
    render(<SecureTasksPanel focus={true} onToggleFocus={vi.fn()} />);
    await screen.findByRole("heading",{name:"Mes 3 priorités du jour"});
    expect(screen.getByRole("button",{name:"Quitter le mode Focus"})).toHaveAttribute("aria-pressed","true");
    expect(screen.getByRole("heading",{name:/Mes rappels sécurisés/})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Créer sur le serveur"})).toBeInTheDocument();
    expect(screen.queryByLabelText("Statut protégé : Dossier fictif à poursuivre")).not.toBeInTheDocument();
  });
});
