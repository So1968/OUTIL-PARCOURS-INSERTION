import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  lireEntretiensSecurises:vi.fn(), enregistrerEntretienSecurise:vi.fn(),
  loadSecureReminders:vi.fn(),
}));
vi.mock("../lib/secureApi", () => ({
  lireEntretiensSecurises:api.lireEntretiensSecurises,
  enregistrerEntretienSecurise:api.enregistrerEntretienSecurise,
}));
vi.mock("../lib/secureTasksApi", () => ({ loadSecureReminders:api.loadSecureReminders }));
import { SecureCaseInterviewsPanel } from "./SecureCaseInterviewsPanel";
const caseId="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const getPage=()=>({caseId,interviews:[],nextOffset:null});
const mount=()=>render(<SecureCaseInterviewsPanel caseId={caseId}/>);
const load=async()=>{
  fireEvent.click(screen.getByRole("button",{name:"Charger mes entretiens"}));
  await screen.findByRole("heading",{name:"Historique des entretiens enregistrés (0)"});
};
beforeEach(()=>{
  vi.clearAllMocks();
  api.lireEntretiensSecurises.mockResolvedValue(getPage());
  api.loadSecureReminders.mockResolvedValue({day:"2026-11-06",reminders:[]});
  api.enregistrerEntretienSecurise.mockResolvedValue({id:"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"});
});
afterEach(()=>cleanup());

describe("entretiens et suites confirmées",()=>{
  it("ne charge rien au montage ni dans localStorage",async()=>{
    const spy=vi.spyOn(Storage.prototype,"getItem");
    mount();
    expect(api.lireEntretiensSecurises).not.toHaveBeenCalled();
    await load();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it("n'enregistre que la date si l'action est facultative et non sélectionnée",async()=>{
    mount();await load();
    fireEvent.change(screen.getByLabelText("Date de l’entretien réalisé"),{
      target:{value:"2026-11-05"},
    });
    fireEvent.click(screen.getByRole("button",{name:"Enregistrer cet entretien"}));
    await waitFor(()=>expect(api.enregistrerEntretienSecurise).toHaveBeenCalledWith({
      caseId,requestId:expect.any(String),interviewDay:"2026-11-05",followUp:null,
    }));
  });
  it("associe l'action, le rappel et la durée dans une seule demande",async()=>{
    mount();await load();
    fireEvent.change(screen.getByLabelText("Date de l’entretien réalisé"),{target:{value:"2026-11-05"}});
    fireEvent.click(screen.getByLabelText("Ajouter une action de suivi à cet entretien (facultatif)"));
    fireEvent.change(screen.getByLabelText("Action à réaliser"),{target:{value:"Relancer un partenaire"}});
    fireEvent.click(screen.getByText("Échéance, rappel et durée (facultatif)"));
    fireEvent.change(screen.getByLabelText("Échéance de l’action"),{target:{value:"2026-11-13"}});
    fireEvent.change(screen.getByLabelText("Rappel dans mon bureau"),{target:{value:"2"}});
    fireEvent.change(screen.getByLabelText("Durée estimée de l’action"),{target:{value:"30"}});
    fireEvent.click(screen.getByRole("button",{name:"Enregistrer cet entretien"}));
    await waitFor(()=>expect(api.enregistrerEntretienSecurise).toHaveBeenCalledWith({
      caseId,requestId:expect.any(String),interviewDay:"2026-11-05",
      followUp:{title:"Relancer un partenaire",dueDate:"2026-11-13",
        reminderDaysBefore:2,estimatedMinutes:30},
    }));
    expect(api.enregistrerEntretienSecurise).toHaveBeenCalledTimes(1);
  });
  it("garde les mêmes données et le même identifiant après une réponse incertaine",async()=>{
    api.enregistrerEntretienSecurise.mockRejectedValueOnce(new Error("Connexion perdue"))
      .mockResolvedValueOnce({id:"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"});
    mount();await load();
    fireEvent.change(screen.getByLabelText("Date de l’entretien réalisé"),{target:{value:"2026-11-05"}});
    fireEvent.click(screen.getByRole("button",{name:"Enregistrer cet entretien"}));
    fireEvent.click(await screen.findByRole("button",{name:"Réessayer sans doublon"}));
    await waitFor(()=>expect(api.enregistrerEntretienSecurise).toHaveBeenCalledTimes(2));
    expect(api.enregistrerEntretienSecurise.mock.calls[0]).toEqual(api.enregistrerEntretienSecurise.mock.calls[1]);
  });
  it("efface la date et l'historique en cas de retrait d'accès",async()=>{
    mount();await load();
    api.lireEntretiensSecurises.mockRejectedValueOnce(Object.assign(new Error("Refus"),{status:404}));
    fireEvent.click(screen.getByRole("button",{name:"Recharger mes entretiens"}));
    expect(await screen.findByText(/Accès aux entretiens indisponible/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Date de l’entretien réalisé")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading",{name:/Historique des entretiens enregistrés/})).not.toBeInTheDocument();
  });
});
