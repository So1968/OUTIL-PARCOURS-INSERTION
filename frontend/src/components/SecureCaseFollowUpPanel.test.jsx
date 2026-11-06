import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  loadSecureTasks:vi.fn(),loadSecureReminders:vi.fn(),createSecureTask:vi.fn(),
  editSecureTask:vi.fn(),nextProfessionalDay:vi.fn(() => "2026-11-12"),
}));
vi.mock("../lib/secureTasksApi", () => api);
import { SecureCaseFollowUpPanel } from "./SecureCaseFollowUpPanel";

const caseId="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const otherCaseId="bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const linked={id:"tache-a",caseId,title:"Relance fictive du dossier",
  dueDate:"2026-11-13",status:"A_FAIRE",version:0};
const unrelated={id:"tache-b",caseId:otherCaseId,title:"SECRET AUTRE DOSSIER",
  dueDate:"2026-11-13",status:"A_FAIRE",version:0};
const unlinked={id:"tache-c",title:"Tâche privée sans dossier",
  dueDate:null,status:"A_FAIRE",version:0};
const mount=()=>render(<MemoryRouter><SecureCaseFollowUpPanel caseId={caseId}/></MemoryRouter>);
const load=async()=>{
  fireEvent.click(screen.getByRole("button",{name:"Charger mes actions du dossier"}));
  await screen.findByText("Relance fictive du dossier");
};

beforeEach(()=>{
  vi.clearAllMocks();
  api.loadSecureTasks.mockResolvedValue([linked,unrelated,unlinked]);
  api.loadSecureReminders.mockResolvedValue({day:"2026-11-11",reminders:[linked,unrelated]});
  api.createSecureTask.mockResolvedValue({id:"tache-nouvelle",caseId});
  api.editSecureTask.mockImplementation(async (task,changes)=>({...task,...changes,version:task.version+1}));
});
afterEach(()=>cleanup());

describe("suites à donner du dossier en mode sécurisé",()=>{
  it("charge uniquement sur demande et exclut tout autre dossier sans localStorage",async()=>{
    const readSpy=vi.spyOn(Storage.prototype,"getItem");
    mount();
    expect(api.loadSecureTasks).not.toHaveBeenCalled();
    await load();
    expect(screen.queryByText("SECRET AUTRE DOSSIER")).not.toBeInTheDocument();
    expect(screen.queryByText("Tâche privée sans dossier")).not.toBeInTheDocument();
    expect(screen.getByText(/dont 1 rappel/)).toBeInTheDocument();
    expect(readSpy).not.toHaveBeenCalled();
    readSpy.mockRestore();
  });

  it("rattache explicitement l'action, la date et le rappel en une seule requête",async()=>{
    mount();await load();
    fireEvent.click(screen.getByText("Actions fréquentes après un entretien (facultatif)"));
    fireEvent.click(screen.getByRole("button",{name:"Relancer la CAF"}));
    fireEvent.click(screen.getByText("Préciser l’échéance et le rappel (facultatif)"));
    fireEvent.change(screen.getByLabelText("Échéance de cette action"),{
      target:{value:"2026-11-18"},
    });
    fireEvent.change(screen.getByLabelText("Rappel dans mon bureau"),{
      target:{value:"2"},
    });
    fireEvent.change(screen.getByLabelText("Durée estimée de cette action"),{
      target:{value:"30"},
    });
    expect(api.createSecureTask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Enregistrer cette action"}));
    await waitFor(()=>expect(api.createSecureTask).toHaveBeenCalledWith(
      "Relancer la CAF",expect.any(String),
      {caseId,dueDate:"2026-11-18",reminderDaysBefore:2,estimatedMinutes:30}
    ));
    expect(api.createSecureTask).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Échéance de cette action")).toHaveValue("");
  });

  it("le formulaire court ne crée pas de date automatique",async()=>{
    mount();await load();
    fireEvent.change(screen.getByPlaceholderText("Ex. Relancer la CAF"),{
      target:{value:"Préparer la suite fictive"},
    });
    fireEvent.click(screen.getByRole("button",{name:"Enregistrer cette action"}));
    await waitFor(()=>expect(api.createSecureTask).toHaveBeenCalledWith(
      "Préparer la suite fictive",expect.any(String),{caseId}
    ));
  });

  it("le réessai conserve strictement la même demande après une interruption",async()=>{
    api.createSecureTask.mockRejectedValueOnce(new Error("Coupure réseau"))
      .mockResolvedValueOnce({id:"tache-nouvelle",caseId});
    mount();await load();
    fireEvent.change(screen.getByPlaceholderText("Ex. Relancer la CAF"),{
      target:{value:"Rappeler le partenaire fictif"},
    });
    fireEvent.click(screen.getByRole("button",{name:"Enregistrer cette action"}));
    const retry=await screen.findByRole("button",{name:"Réessayer sans doublon"});
    fireEvent.click(retry);
    await waitFor(()=>expect(api.createSecureTask).toHaveBeenCalledTimes(2));
    expect(api.createSecureTask.mock.calls[0]).toEqual(api.createSecureTask.mock.calls[1]);
  });

  it("termine une action par version, sans modifier celles d'autres dossiers",async()=>{
    mount();await load();
    fireEvent.click(screen.getByRole("button",{name:"Terminer"}));
    await waitFor(()=>expect(api.editSecureTask).toHaveBeenCalledWith(
      expect.objectContaining({id:"tache-a",caseId}),{status:"FAIT"}
    ));
  });

  it("efface toute tâche du dossier après un refus serveur",async()=>{
    mount();await load();
    api.editSecureTask.mockRejectedValueOnce(Object.assign(new Error("refus"),{status:404}));
    fireEvent.click(screen.getByRole("button",{name:"Terminer"}));
    expect(await screen.findByText(/Accès au dossier indisponible/)).toBeInTheDocument();
    expect(screen.queryByText("Relance fictive du dossier")).not.toBeInTheDocument();
    expect(screen.queryByRole("button",{name:"Enregistrer cette action"})).not.toBeInTheDocument();
  });
});
