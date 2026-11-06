import { describe, expect, it } from "vitest";
import { validInterviewDay, buildInterviewDraft, checkedInterviewList } from "./secureInterviewData";

const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const id = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
describe("date d'entretien et suite facultative", () => {
  it("exige une date réelle non future sans en inventer", () => {
    expect(validInterviewDay("2026-11-05","2026-11-06")).toBe(true);
    for (const day of ["", "2026-02-30", "2026-11-07", "2026-13-01", "2026-11-6"]) {
      expect(validInterviewDay(day,"2026-11-06")).toBe(false);
    }
    expect(() => buildInterviewDraft({interviewDay:"",serverDay:"2026-11-06"}))
      .toThrow("DATE_ENTRETIEN_INVALIDE");
  });
  it("garde l'entretien sans tâche quand la suite n'est pas cochée", () => {
    expect(buildInterviewDraft({interviewDay:"2026-11-05",serverDay:"2026-11-06",
      title:"Titre ignoré",dueDate:"2026-11-10"}))
      .toEqual({interviewDay:"2026-11-05",followUp:null});
  });
  it("confirme au plus une action sans échéance déduite", () => {
    expect(buildInterviewDraft({interviewDay:"2026-11-05",serverDay:"2026-11-06",
      includeFollowUp:true,title:"  Relancer un partenaire  ",dueDate:"2026-11-10",
      reminderDaysBefore:2,estimatedMinutes:"30"}))
      .toEqual({interviewDay:"2026-11-05",followUp:{
        title:"Relancer un partenaire",dueDate:"2026-11-10",
        reminderDaysBefore:2,estimatedMinutes:30,
      }});
    expect(buildInterviewDraft({interviewDay:"2026-11-05",serverDay:"2026-11-06",
      includeFollowUp:true,title:"Bilan fictif"}))
      .toEqual({interviewDay:"2026-11-05",followUp:{title:"Bilan fictif"}});
  });
  it("contrôle le contrat de la liste et sa pagination", () => {
    const item={id,interviewDay:"2026-11-05",createdAt:"2026-11-05T14:00:00Z",
      followUp:{id:"cccccccc-cccc-4ccc-cccc-cccccccccccc",title:"Relance fictive",status:"A_FAIRE"}};
    const page={caseId,interviews:[item],nextOffset:null};
    expect(checkedInterviewList(page,caseId)).toEqual(page);
    for (const bad of [
      {...page,caseId:id},{...page,interviews:[{...item,id:"invalide"}]},
      {...page,interviews:[{...item,followUp:{...item.followUp,title:""}}]},
      {...page,nextOffset:100},
    ]) expect(() => checkedInterviewList(bad,caseId)).toThrow("LISTE_ENTRETIENS_INVALIDE");
  });
});
