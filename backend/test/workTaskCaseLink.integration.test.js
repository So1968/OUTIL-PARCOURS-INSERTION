import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { COOKIE_NAME, issueSession } from "../src/sessions.js";

test("PostgreSQL/HTTP : tâches de dossier rattachées uniquement à une référente autorisée", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const a = randomUUID(), b = randomUUID(), tns = randomUUID();
  const caseId = randomUUID(), otherCaseId = randomUUID();
  const oidc = {
    origin: "https://artag.example.org", redirectUri: "https://artag.example.org/auth/callback",
    provider: { issuer: "https://idp.example.org", generateVerifier: () => "fictif",
      authorizationUrl: async () => "https://idp.example.org/authorize",
      verifyCallback: async () => ({issuer:"https://idp.example.org",subject:"fictif"}) },
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      {id:a,email:"referente-a-" + a + "@example.org",role:"REFERENTE",enabled:true},
      {id:b,email:"referente-b-" + b + "@example.org",role:"REFERENTE",enabled:true},
      {id:tns,email:"appui-tns-" + tns + "@example.org",role:"APPUI_TNS",enabled:true},
    ] });
    await db.caseFile.createMany({data:[
      {id:caseId,referentId:a,artagReference:"DOSSIER-FICTIF-"+caseId,version:1},
      {id:otherCaseId,referentId:b,artagReference:"AUTRE-FICTIF-"+otherCaseId,version:1},
    ]});
    // Une affectation au partage ne donne pas droit aux tâches réservées.
    await db.caseAssignment.create({data:{caseId,userId:tns,capability:"SHARED_READ",active:true}});
    const [sa,sb,st] = await Promise.all([issueSession({db,userId:a}),issueSession({db,userId:b}),issueSession({db,userId:tns})]);
    server=createApp({privateDb:db,oidc,enableWorkTasks:true,
      clock:()=>new Date("2026-11-11T09:00:00Z"),
      csrfSecret:"secret-test-taches-dossier-fictives-au-moins-32-caracteres"}).listen(0,"127.0.0.1");
    await once(server,"listening");
    const base="http://127.0.0.1:"+server.address().port,path=base+"/api/mes-taches";
    const headers=token=>({Cookie:COOKIE_NAME+"="+token});
    const csrf=async token=>{
      const response=await fetch(base+"/auth/csrf",{headers:headers(token)});
      assert.equal(response.status,200);
      return (await response.json()).token;
    };
    const [ca,cb,ct]=await Promise.all([csrf(sa.token),csrf(sb.token),csrf(st.token)]);
    const write=(url,token,csrfToken,method,body)=>fetch(url,{
      method,headers:{...headers(token),Origin:oidc.origin,"X-CSRF-Token":csrfToken,
        "Content-Type":"application/json"},body:JSON.stringify(body),
    });
    const list=(url,token)=>fetch(url,{headers:headers(token)});
    const body={title:"Relancer une démarche fictive",caseId,dueDate:"2026-11-13",
      reminderDaysBefore:2,estimatedMinutes:20,requestId:randomUUID()};
    assert.equal((await write(path,sa.token,"x".repeat(64),"POST",body)).status,403);
    assert.equal((await write(path,sb.token,cb,"POST",body)).status,404);
    assert.equal((await write(path,st.token,ct,"POST",body)).status,404);
    assert.equal((await write(path,sa.token,ca,"POST",{...body,caseId:otherCaseId})).status,404);
    assert.equal((await write(path,sa.token,ca,"POST",{...body,caseId:"non-valide"})).status,422);
    const response=await write(path,sa.token,ca,"POST",body);
    assert.equal(response.status,201);
    const linked=await response.json();
    assert.equal(linked.caseId,caseId);
    assert.equal(linked.dueDate,"2026-11-13");
    assert.equal(linked.estimatedMinutes,20);
    assert.equal(linked.reminderDaysBefore,2);
    assert.equal((await write(path,sa.token,ca,"POST",body)).status,201);
    assert.equal(await db.workTask.count({where:{ownerId:a}}),1);
    assert.equal((await write(path,sa.token,ca,"POST",{...body,title:"Nouvelle tâche différente"})).status,409);

    const freeResponse=await write(path,sa.token,ca,"POST",{
      title:"Tâche libre personnelle",requestId:randomUUID(),
    });
    assert.equal(freeResponse.status,201);
    const free=await freeResponse.json();
    assert.equal(Object.hasOwn(free,"caseId"),false);
    const before=(await (await list(path,sa.token)).json()).tasks;
    assert.deepEqual(new Set(before.map(x=>x.id)),new Set([linked.id,free.id]));
    assert.equal((await (await list(path,sb.token)).json()).tasks.length,0);
    assert.deepEqual((await (await list(base+"/api/mes-rappels",sa.token)).json()).reminders.map(x=>x.id),[linked.id]);
    assert.equal((await write(path+"/"+linked.id,sa.token,ca,"PATCH",{
      expectedVersion:0,changes:{caseId:otherCaseId},
    })).status,422);

    // Transfert : les tâches liées disparaissent immédiatement du bureau
    // de l'ancienne référente. Le nouvel auteur ne les récupère pas.
    await db.caseFile.update({where:{id:caseId},data:{referentId:b,version:{increment:1}}});
    assert.deepEqual((await (await list(path,sa.token)).json()).tasks.map(x=>x.id),[free.id]);
    assert.deepEqual((await (await list(base+"/api/mes-rappels",sa.token)).json()).reminders,[]);
    assert.equal((await write(path+"/"+linked.id,sa.token,ca,"PATCH",{
      expectedVersion:0,changes:{status:"FAIT"},
    })).status,404);
    assert.equal((await write(path,sa.token,ca,"POST",body)).status,404);
    assert.equal((await (await list(path,sb.token)).json()).tasks.length,0);

    // Réattribution réactive la tâche de son autrice sans élargir les droits.
    await db.caseFile.update({where:{id:caseId},data:{referentId:a,version:{increment:1}}});
    assert.equal((await write(path+"/"+linked.id,sa.token,ca,"PATCH",{
      expectedVersion:0,changes:{status:"FAIT"},
    })).status,200);
    assert.deepEqual((await (await list(base+"/api/mes-rappels",sa.token)).json()).reminders,[]);
    await db.caseFile.update({where:{id:caseId},data:{archivedAt:new Date()}});
    assert.deepEqual((await (await list(path,sa.token)).json()).tasks.map(x=>x.id),[free.id]);
    assert.equal((await write(path+"/"+linked.id,sa.token,ca,"PATCH",{
      expectedVersion:1,changes:{status:"A_FAIRE"},
    })).status,404);

    const audit=await db.auditEvent.findMany({where:{actorId:a,eventType:{in:[
      "WORK_TASK_CREATED","WORK_TASK_UPDATED","WORK_TASK_LIST_READ","WORK_TASK_REMINDERS_READ",
    ]}}});
    assert.ok(audit.length>=6);
    assert.ok(!JSON.stringify(audit).includes(body.title));
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    await db.workTask.deleteMany({where:{ownerId:{in:[a,b,tns]}}});
    await db.auditEvent.deleteMany({where:{actorId:{in:[a,b,tns]}}});
    await db.caseAssignment.deleteMany({where:{caseId:{in:[caseId,otherCaseId]}}});
    await db.caseFile.deleteMany({where:{id:{in:[caseId,otherCaseId]}}});
    await db.webSession.deleteMany({where:{userId:{in:[a,b,tns]}}});
    await db.userAccount.deleteMany({where:{id:{in:[a,b,tns]}}});
    await db.$disconnect();
  }
});
