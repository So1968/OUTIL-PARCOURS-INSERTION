import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { COOKIE_NAME, issueSession } from "../src/sessions.js";

test("PostgreSQL : entretien daté et suite facultative créés ensemble sans fuite", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async ()=>{
  const { PrismaClient } = await import("@prisma/client");
  const db=new PrismaClient();
  const ref=randomUUID(), next=randomUUID(), tns=randomUUID(), caseId=randomUUID();
  const oidc={origin:"https://artag.example.org",redirectUri:"https://artag.example.org/auth/callback",
    provider:{issuer:"https://idp.example.org",generateVerifier:()=>"fictif",
      authorizationUrl:async()=>"https://idp.example.org/authorize",
      verifyCallback:async()=>({issuer:"https://idp.example.org",subject:"fictif"})}};
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({data:[
      {id:ref,email:"ref-entretien-"+ref+"@example.org",role:"REFERENTE",enabled:true},
      {id:next,email:"suivi-entretien-"+next+"@example.org",role:"REFERENTE",enabled:true},
      {id:tns,email:"tns-entretien-"+tns+"@example.org",role:"APPUI_TNS",enabled:true},
    ]});
    await db.caseFile.create({data:{id:caseId,referentId:ref,
      artagReference:"DOSSIER-ENTRETIEN-FICTIF-"+caseId,version:1}});
    await db.caseAssignment.create({data:{
      caseId,userId:tns,capability:"SHARED_READ",active:true,
    }});
    const [a,b,c]=await Promise.all([
      issueSession({db,userId:ref}),issueSession({db,userId:next}),issueSession({db,userId:tns}),
    ]);
    server=createApp({privateDb:db,oidc,enableSharedWrites:true,enableWorkTasks:true,
      clock:()=>new Date("2026-11-06T10:00:00Z"),
      csrfSecret:"secret-fictif-traces-entretiens-et-suites-confirmees-32"}).listen(0,"127.0.0.1");
    await once(server,"listening");
    const base="http://127.0.0.1:"+server.address().port,
      url=base+"/api/dossiers/"+caseId+"/entretiens";
    const headers=token=>({Cookie:COOKIE_NAME+"="+token});
    const csrf=async token=>{
      const r=await fetch(base+"/auth/csrf",{headers:headers(token)});
      assert.equal(r.status,200);return (await r.json()).token;
    };
    const [tokenA,tokenB,tokenC]=await Promise.all([csrf(a.token),csrf(b.token),csrf(c.token)]);
    const read=(token,q="")=>fetch(url+q,{headers:headers(token)});
    const write=(token,csrfToken,body,origin=oidc.origin)=>fetch(url,{
      method:"POST",headers:{...headers(token),Origin:origin,
        "X-CSRF-Token":csrfToken,"Content-Type":"application/json"},
      body:JSON.stringify(body),
    });
    const input={
      requestId:randomUUID(),interviewDay:"2026-11-04",
      followUp:{title:"Relancer un partenaire fictif",dueDate:"2026-11-12",
        reminderDaysBefore:2,estimatedMinutes:15},
    };
    assert.equal((await read(a.token)).status,200);
    assert.deepEqual((await (await read(a.token)).json()).interviews,[]);
    assert.equal((await read(b.token)).status,404);
    assert.equal((await read(c.token)).status,404);
    assert.equal((await write(c.token,tokenC,input)).status,404);
    assert.equal((await write(b.token,tokenB,input)).status,404);
    assert.equal((await write(a.token,"a".repeat(64),input)).status,403);
    assert.equal((await write(a.token,tokenA,input,"https://attaque.example.org")).status,403);
    assert.equal((await write(a.token,tokenA,{...input,ownerId:tns})).status,422);
    assert.equal((await write(a.token,tokenA,{...input,interviewDay:"2026-11-07"})).status,422);
    assert.equal((await write(a.token,tokenA,{...input,interviewDay:"2026-02-30"})).status,422);
    assert.equal((await write(a.token,tokenA,{...input,
      followUp:{...input.followUp,diagnostic:"interdit"}})).status,422);
    assert.equal(await db.caseInterview.count(),0);
    assert.equal(await db.workTask.count(),0);

    const first=await write(a.token,tokenA,input);
    assert.equal(first.status,201);
    const recorded=await first.json();
    assert.equal(recorded.interviewDay,"2026-11-04");
    assert.equal(recorded.followUp.title,input.followUp.title);
    assert.equal(recorded.followUp.dueDate,"2026-11-12");
    assert.equal(recorded.followUp.reminderDaysBefore,2);
    assert.equal(recorded.followUp.estimatedMinutes,15);
    assert.equal(await db.caseInterview.count(),1);
    assert.equal(await db.workTask.count(),1);
    const task=await db.workTask.findUnique({where:{id:recorded.followUp.id}});
    assert.equal(task.ownerId,ref);
    assert.equal(task.caseId,caseId);
    assert.equal(task.interviewId,recorded.id);
    assert.equal(task.requestId,input.requestId);
    const replay=await write(a.token,tokenA,input);
    assert.equal(replay.status,201);
    assert.deepEqual(await replay.json(),recorded);
    assert.equal(await db.caseInterview.count(),1);
    assert.equal(await db.workTask.count(),1);
    assert.equal((await write(a.token,tokenA,{...input,interviewDay:"2026-11-03"})).status,409);
    assert.equal((await write(a.token,tokenA,{...input,
      followUp:{...input.followUp,title:"Une autre action fictive"}})).status,409);

    const list=await read(a.token);
    assert.equal(list.status,200);
    assert.equal(list.headers.get("cache-control"),"no-store");
    assert.deepEqual((await list.json()).interviews.map(item=>item.id),[recorded.id]);
    const reminders=await fetch(base+"/api/mes-rappels",{headers:headers(a.token)});
    assert.equal(reminders.status,200);
    assert.deepEqual((await reminders.json()).reminders.map(item=>item.id),[recorded.followUp.id]);

    // Un entretien peut ne pas générer de tâche.
    const second=await write(a.token,tokenA,{
      requestId:randomUUID(),interviewDay:"2026-11-05",followUp:null,
    });
    assert.equal(second.status,201);
    assert.equal((await second.json()).followUp,null);
    assert.equal(await db.caseInterview.count(),2);
    assert.equal(await db.workTask.count(),1);
    assert.equal((await read(a.token,"?offset=invalid")).status,422);

    // Le changement de référente ne dévoile jamais les entretiens de l'autrice.
    await db.caseFile.update({where:{id:caseId},data:{referentId:next,version:{increment:1}}});
    assert.equal((await read(a.token)).status,404);
    assert.equal((await write(a.token,tokenA,input)).status,404);
    assert.equal((await read(b.token)).status,200);
    assert.deepEqual((await (await read(b.token)).json()).interviews,[]);
    const nextRecord=await write(b.token,tokenB,{
      requestId:randomUUID(),interviewDay:"2026-11-06",followUp:null,
    });
    assert.equal(nextRecord.status,201);
    assert.equal((await (await read(b.token)).json()).interviews.length,1);
    assert.equal(await db.caseInterview.count(),3);

    const audits=await db.auditEvent.findMany({where:{caseId}});
    assert.ok(audits.some(x=>x.eventType==="CASE_INTERVIEW_RECORDED"));
    assert.ok(audits.some(x=>x.eventType==="CASE_INTERVIEW_REPLAYED"));
    assert.ok(audits.some(x=>x.eventType==="CASE_INTERVIEWS_READ"));
    assert.doesNotMatch(JSON.stringify(audits),/Relancer un partenaire fictif/);
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    await db.workTask.deleteMany({where:{caseId}});
    await db.caseInterview.deleteMany({where:{caseId}});
    await db.auditEvent.deleteMany({where:{caseId}});
    await db.caseAssignment.deleteMany({where:{caseId}});
    await db.caseFile.deleteMany({where:{id:caseId}});
    await db.webSession.deleteMany({where:{userId:{in:[ref,next,tns]}}});
    await db.userAccount.deleteMany({where:{id:{in:[ref,next,tns]}}});
    await db.$disconnect();
  }
});
