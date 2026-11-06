import { prepareSecureTaskCreate } from "./secureTaskCreation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function validInterviewDay(day, serverDay) {
  if (typeof day !== "string" || typeof serverDay !== "string"
    || !DAY.test(day) || !DAY.test(serverDay) || day > serverDay) return false;
  const parsed = new Date(day + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}

export function buildInterviewDraft({ interviewDay, serverDay, includeFollowUp = false,
  title = "", dueDate = "", reminderDaysBefore = 1, estimatedMinutes = "" }) {
  if (!validInterviewDay(interviewDay, serverDay)) throw new Error("DATE_ENTRETIEN_INVALIDE");
  if (!includeFollowUp) return { interviewDay, followUp: null };
  const options = {};
  if (dueDate) { options.dueDate = dueDate; options.reminderDaysBefore = Number(reminderDaysBefore); }
  if (estimatedMinutes !== "") options.estimatedMinutes = Number(estimatedMinutes);
  return { interviewDay, followUp: prepareSecureTaskCreate(title, options) };
}

export function checkedInterviewList(page, caseId, offset = 0) {
  if (!page || typeof page !== "object" || Array.isArray(page)
    || page.caseId !== caseId || !UUID.test(caseId)
    || !Array.isArray(page.interviews) || page.interviews.length > 100
    || (page.nextOffset !== null && (!Number.isSafeInteger(page.nextOffset)
      || page.nextOffset <= offset || page.interviews.length !== 100))) {
    throw new Error("LISTE_ENTRETIENS_INVALIDE");
  }
  for (const item of page.interviews) {
    if (!item || typeof item !== "object" || !UUID.test(item.id)
      || !DAY.test(item.interviewDay ?? "") || !validInterviewDay(item.interviewDay, "9999-12-31")
      || !Number.isFinite(Date.parse(item.createdAt))
      || (item.followUp !== null && (!item.followUp || !UUID.test(item.followUp.id)
        || typeof item.followUp.title !== "string" || !item.followUp.title.trim()
        || item.followUp.title.length > 200
        || !["A_FAIRE", "EN_COURS", "EN_ATTENTE", "FAIT"].includes(item.followUp.status)))) {
      throw new Error("LISTE_ENTRETIENS_INVALIDE");
    }
  }
  return page;
}
