import test from "node:test";
import assert from "node:assert/strict";
import { ROLES, CAPABILITIES, canAccessCase, canReadAggregates } from "../src/policy.js";

const base = {
  id: "case-demo", referentId: "ref-1",
  assignments: [
    { userId: "tns-1", capability: CAPABILITIES.TNS_READ, active: true },
    { userId: "tns-1", capability: CAPABILITIES.TNS_WRITE, active: true },
    { userId: "accueil-1", capability: CAPABILITIES.SHARED_READ, active: true },
  ],
  grants: [],
};
const who = (role, id) => ({ role, id, enabled: true });
const may = (actor, capability, dossier = base, options = {}) =>
  canAccessCase({ actor, capability, dossier, ...options });

test("refuse toute demande anonyme, profil navigateur ou compte désactivé", () => {
  assert.equal(may(undefined, CAPABILITIES.SHARED_READ), false);
  assert.equal(may(who(ROLES.DEMONSTRATION, "x"), CAPABILITIES.SHARED_READ), false);
  assert.equal(may({ ...who(ROLES.REFERENTE, "ref-1"), enabled: false }, CAPABILITIES.SHARED_READ), false);
  assert.equal(may(who(ROLES.REFERENTE, "ref-1"), "not:a:capability"), false);
  assert.equal(may(who(ROLES.REFERENTE, "ref-1"), CAPABILITIES.SHARED_READ, {}), false);
});

test("la référente voit uniquement les dossiers dont elle est chargée", () => {
  assert.equal(may(who(ROLES.REFERENTE, "ref-1"), CAPABILITIES.SHARED_READ), true);
  assert.equal(may(who(ROLES.REFERENTE, "ref-1"), CAPABILITIES.SHARED_WRITE), true);
  assert.equal(may(who(ROLES.REFERENTE, "ref-2"), CAPABILITIES.SHARED_READ), false);
});

test("l'appui TNS ne voit que le module explicitement confié", () => {
  const actor = who(ROLES.APPUI_TNS, "tns-1");
  assert.equal(may(actor, CAPABILITIES.TNS_READ), true);
  assert.equal(may(actor, CAPABILITIES.TNS_WRITE), true);
  assert.equal(may(actor, CAPABILITIES.SHARED_READ), false);
  assert.equal(may(actor, CAPABILITIES.RESERVED_READ, base, { noteAuthorId: "tns-1" }), false);
  assert.equal(may(who(ROLES.APPUI_TNS, "tns-2"), CAPABILITIES.TNS_READ), false);
});

test("accueil et relais n'accèdent pas à la note réservée", () => {
  assert.equal(may(who(ROLES.ACCUEIL, "accueil-1"), CAPABILITIES.SHARED_READ), true);
  assert.equal(may(who(ROLES.ACCUEIL, "accueil-1"), CAPABILITIES.SHARED_WRITE), false);
  assert.equal(may(who(ROLES.ACCUEIL, "accueil-1"), CAPABILITIES.RESERVED_READ, base, { noteAuthorId: "accueil-1" }), false);
  assert.equal(may(who(ROLES.RELAIS_LOGEMENT, "relais-1"), CAPABILITIES.SHARED_READ), false);
});

test("seule l'auteure professionnelle habilitée lit ses notes réservées", () => {
  assert.equal(may(who(ROLES.REFERENTE, "ref-1"), CAPABILITIES.RESERVED_READ, base, { noteAuthorId: "ref-1" }), true);
  assert.equal(may(who(ROLES.REFERENTE, "ref-1"), CAPABILITIES.RESERVED_READ, base, { noteAuthorId: "other" }), false);
  assert.equal(may(who(ROLES.REFERENTE, "ref-2"), CAPABILITIES.RESERVED_READ, base, { noteAuthorId: "ref-2" }), false);
});

test("administration technique et gouvernance ne voient jamais les dossiers individuels", () => {
  for (const role of [ROLES.ADMIN_TECHNIQUE, ROLES.GOUVERNANCE]) {
    assert.equal(may(who(role, "tech"), CAPABILITIES.SHARED_READ), false);
    assert.equal(may(who(role, "tech"), CAPABILITIES.RESERVED_READ), false);
  }
  assert.equal(canReadAggregates(who(ROLES.GOUVERNANCE, "ca")), true);
  assert.equal(canReadAggregates(who(ROLES.DIRECTION, "dir")), true);
  assert.equal(canReadAggregates(who(ROLES.ADMIN_TECHNIQUE, "tech")), false);
});

test("la direction nécessite une dérogation nominative, motivée et bornée", () => {
  const dir = who(ROLES.DIRECTION, "dir-1");
  const grant = {
    userId: "dir-1", capability: CAPABILITIES.SHARED_READ,
    reason: "Relais urgent validé", approvedBy: "ref-1",
    startsAt: "2026-10-22T09:00:00.000Z", expiresAt: "2026-10-22T12:00:00.000Z",
  };
  assert.equal(may(dir, CAPABILITIES.SHARED_READ), false);
  assert.equal(may(dir, CAPABILITIES.SHARED_READ, { ...base, grants: [grant] }, { now: new Date("2026-10-22T10:00:00Z") }), true);
  assert.equal(may(dir, CAPABILITIES.SHARED_READ, { ...base, grants: [grant] }, { now: new Date("2026-10-22T12:00:00Z") }), false);
  assert.equal(may(dir, CAPABILITIES.SHARED_WRITE, { ...base, grants: [grant] }, { now: new Date("2026-10-22T10:00:00Z") }), false);
  assert.equal(may(dir, CAPABILITIES.RESERVED_READ, { ...base, grants: [grant] }, { now: new Date("2026-10-22T10:00:00Z"), noteAuthorId: "dir-1" }), false);
  assert.equal(may(dir, CAPABILITIES.SHARED_READ, { ...base, grants: [{ ...grant, revokedAt: "2026-10-22T09:40:00.000Z" }] }, { now: new Date("2026-10-22T10:00:00Z") }), false);
  assert.equal(may(dir, CAPABILITIES.SHARED_READ, { ...base, grants: [{ ...grant, reason: "" }] }, { now: new Date("2026-10-22T10:00:00Z") }), false);
});

test("un indicateur agrégé ne doit pas permettre un accès individuel", () => {
  const dir = who(ROLES.DIRECTION, "dir-1");
  assert.equal(canReadAggregates(dir), true);
  assert.equal(may(dir, CAPABILITIES.SHARED_READ), false);
});
