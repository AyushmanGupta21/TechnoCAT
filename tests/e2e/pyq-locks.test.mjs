// PYQ section lock cycle. Usage: node pyq-locks.test.mjs <demoToken>
const B = process.env.E2E_BASE_URL || "http://localhost:3001";
let cookie = "";
async function call(method, path, body, ck) {
  const res = await fetch(B + path, { method, headers: { "content-type": "application/json", cookie: ck ?? cookie }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get("set-cookie");
  if (!ck && sc && sc.includes("technocat_session=")) cookie = sc.split(";")[0];
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const ok = (label, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`);
const attempt = () => call("POST", "/api/pyq/attempts", { year: 2024, slot: "Slot 1", section: "DILR", answers: {}, timeTakenSeconds: 600, strikes: 0 });

await call("POST", "/api/auth/signup", { fullName: "Lock Test", email: `qa-lock-${Date.now()}@example.com`, password: "Lock-Test-Pass-1" });
let r;
for (let i = 1; i <= 3; i++) r = await attempt();
const dilr = r.json?.sectionStats?.DILR;
ok("3 attempts lock DILR with a non-empty checklist", r.status === 200 && dilr?.isLocked === true && dilr.weakAreas.length > 0, `locked=${dilr?.isLocked}, checklist=${dilr?.weakAreas?.length}`);
ok("score graded by the server (blank answers = 0)", r.json?.score === 0 && r.json?.total === 66, `${r.json?.score}/${r.json?.total}`);
r = await attempt();
ok("4th attempt refused while locked", r.status === 423, `status ${r.status}`);
r = await call("PATCH", "/api/pyq/attempts", { section: "DILR", action: "unlock" });
ok("client cannot force-unlock", r.json?.sectionStats?.DILR?.isLocked === true);

for (const w of dilr.weakAreas) await call("POST", "/api/topics/progress", { topicId: w.topicId, lessonId: w.lessonId });
r = await call("GET", "/api/pyq/attempts?year=2024");
const after = r.json?.sectionStats?.DILR;
ok("completing checklist lessons unlocks with a fresh cycle", after?.isLocked === false && after?.attemptsCount === 0 && after?.attemptsLeft === 3, JSON.stringify({ locked: after?.isLocked, used: after?.attemptsCount, left: after?.attemptsLeft }));
r = await attempt();
ok("new attempt allowed after unlock", r.status === 200 && r.json?.sectionStats?.DILR?.attemptsCount === 1, `used=${r.json?.sectionStats?.DILR?.attemptsCount}`);

const demo = await call("GET", "/api/pyq/attempts?year=2024", null, `technocat_session=${process.argv[2]}`);
const d = demo.json?.sectionStats?.DILR;
ok("demo account DILR no longer stuck (no empty-checklist lock)", d && !(d.isLocked && d.weakAreas.length === 0), JSON.stringify({ locked: d?.isLocked, checklist: d?.weakAreas?.length }));

await call("POST", "/api/auth/delete-account");
