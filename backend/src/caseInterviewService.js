import { resolveSessionUserId } from "./sessions.js";
import { professionalDay, authorizedCase, validFields,
  WorkTaskAccessDenied, WorkTaskInvalid } from "./workTaskService.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_FOLLOW_UP = new Set(["title", "dueDate", "reminderDaysBefore", "estimatedMinutes"]);

export class InterviewUnavailable extends Error {
  constructor() { super("ENTRETIEN_INDISPONIBLE"); this.name = "InterviewUnavailable"; }
}
export class InvalidInterview extends Error {
  constructor() { super("ENTRETIEN_INVALIDE"); this.name = "InvalidInterview"; }
}
export class InterviewConflict extends Error {
  constructor() { super("ENTRETIEN_DEJA_ENREGISTRE"); this.name = "InterviewConflict"; }
}

function dayValue(value, now) {
  if (typeof value !== "string" || !DAY.test(value)) throw new InvalidInterview();
  const parsed = new Date(value + "T00:00:00.000Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value
    || value > professionalDay(now)) throw new InvalidInterview();
  return parsed;
}

function inputValue(input, now) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).some(key => !["requestId","interviewDay","followUp"].includes(key))
    || typeof input.requestId !== "string" || !UUID.test(input.requestId)) {
    throw new InvalidInterview();
  }
  const day = dayValue(input.interviewDay, now);
  let task = null;
  if (input.followUp !== undefined && input.followUp !== null) {
    const f = input.followUp;
    if (!f || typeof f !== "object" || Array.isArray(f) || !Object.hasOwn(f,"title")
      || Object.keys(f).some(key => !ALLOWED_FOLLOW_UP.has(key))) throw new InvalidInterview();
    try { task = validFields(f, {create:true}); }
    catch (error) { if(error instanceof WorkTaskInvalid) throw new InvalidInterview(); throw error; }
  }
  return { day, task, requestId: input.requestId };
}

function exposed(row) {
  const task = row.followUp;
  return {
    id: row.id,
    interviewDay: row.interviewDay.toISOString().slice(0,10),
    createdAt: row.createdAt,
    followUp: task ? {
      id:task.id, title:task.title, dueDate:task.dueDate?.toISOString().slice(0,10) ?? null,
      reminderDaysBefore:task.reminderDaysBefore, estimatedMinutes:task.estimatedMinutes,
      status:task.status, version:task.version,
    } : null,
  };
}

const interviewSelect = {
  id:true, interviewDay:true, createdAt:true,
  followUp:{ select:{ id:true,title:true,dueDate:true,reminderDaysBefore:true,
    estimatedMinutes:true,status:true,version:true } },
};

async function actorForCase(tx, cookieHeader, caseId, now) {
  const userId = await resolveSessionUserId({db:tx,cookieHeader,now});
  if (!userId || !UUID.test(userId)) throw new InterviewUnavailable();
  const actor = await tx.userAccount.findUnique({
    where:{id:userId},select:{id:true,role:true,enabled:true},
  });
  if (!actor?.enabled || actor.role !== "REFERENTE") throw new InterviewUnavailable();
  try { await authorizedCase(tx, actor, caseId); }
  catch(error) { if(error instanceof WorkTaskAccessDenied) throw new InterviewUnavailable(); throw error; }
  return actor;
}

function check(db, caseId, now) {
  if (!db?.$transaction || !db.webSession || !db.caseInterview || !db.workTask
    || typeof caseId !== "string" || !UUID.test(caseId)
    || !(now instanceof Date) || Number.isNaN(now.getTime())) throw new InterviewUnavailable();
}

async function transaction(db, action) {
  try { return await db.$transaction(action, {isolationLevel:"Serializable"}); }
  catch(error) {
    if (["P2002","P2034"].includes(error?.code)) throw new InterviewConflict();
    throw error;
  }
}

export async function recordOwnInterview({
  db, cookieHeader, caseId, input, now = new Date(),
} = {}) {
  check(db,caseId,now);
  const {day,task,requestId} = inputValue(input,now);
  return transaction(db, async tx => {
    const actor=await actorForCase(tx,cookieHeader,caseId,now);
    const result=await tx.caseInterview.createMany({
      data:[{caseId,ownerId:actor.id,interviewDay:day,requestId}],
      skipDuplicates:true,
    });
    const row=await tx.caseInterview.findUnique({
      where:{ownerId_requestId:{ownerId:actor.id,requestId}},
      select:{id:true,caseId:true,interviewDay:true,
        followUp:{select:{title:true,dueDate:true,reminderDaysBefore:true,estimatedMinutes:true}}},
    });
    if (!row || row.caseId!==caseId
      || row.interviewDay.toISOString().slice(0,10)!==day.toISOString().slice(0,10)) {
      throw new InterviewConflict();
    }
    if (result.count === 1) {
      if (task) {
        await tx.workTask.create({ data:{
          ...task, ownerId:actor.id,caseId,interviewId:row.id,requestId,
        } });
      }
    } else {
      if (Boolean(row.followUp) !== Boolean(task)) throw new InterviewConflict();
      if (task) {
        const actual=row.followUp;
        const expected={
          title:task.title,
          dueDate:task.dueDate?.toISOString().slice(0,10) ?? null,
          reminderDaysBefore:task.reminderDaysBefore ?? 1,
          estimatedMinutes:task.estimatedMinutes ?? null,
        };
        const saved={
          title:actual.title,
          dueDate:actual.dueDate?.toISOString().slice(0,10) ?? null,
          reminderDaysBefore:actual.reminderDaysBefore,
          estimatedMinutes:actual.estimatedMinutes,
        };
        if (JSON.stringify(expected)!==JSON.stringify(saved)) throw new InterviewConflict();
      }
    }
    const recorded=await tx.caseInterview.findUnique({
      where:{id:row.id},select:interviewSelect,
    });
    if (!recorded) throw new InterviewConflict();
    await tx.auditEvent.create({data:{
      caseId,actorId:actor.id,
      eventType:result.count===1?"CASE_INTERVIEW_RECORDED":"CASE_INTERVIEW_REPLAYED",
      purpose:"Trace minimale d'un entretien et de sa suite éventuelle",
    }});
    return exposed(recorded);
  });
}

export async function listOwnInterviews({
  db,cookieHeader,caseId,offset=0,now=new Date(),
} = {}) {
  check(db,caseId,now);
  if (!Number.isSafeInteger(offset)||offset<0||offset>100000) throw new InvalidInterview();
  return transaction(db, async tx=>{
    const actor=await actorForCase(tx,cookieHeader,caseId,now);
    const rows=await tx.caseInterview.findMany({
      where:{caseId,ownerId:actor.id},
      orderBy:[{interviewDay:"desc"},{createdAt:"desc"},{id:"desc"}],
      select:interviewSelect,skip:offset,take:101,
    });
    await tx.auditEvent.create({data:{
      caseId,actorId:actor.id,eventType:"CASE_INTERVIEWS_READ",
      purpose:"Lecture des dates d'entretien de la professionnelle",
    }});
    return {caseId,interviews:rows.slice(0,100).map(exposed),
      nextOffset:rows.length>100?offset+100:null};
  });
}
