// End-to-end Phase 1 test against the running server (http://localhost:3001).
// Usage: node phase1test.mjs <repoRoot> <demoSessionToken>
import fs from "node:fs";

const ROOT = process.argv[2];
const B = "http://localhost:3001";
let cookie = "";

async function call(method, path, body, ck) {
  const useCk = ck ?? cookie;
  const res = await fetch(B + path, {
    method,
    headers: { "content-type": "application/json", cookie: useCk },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.get("set-cookie");
  if (!ck && sc && sc.includes("technocat_session=")) cookie = sc.split(";")[0];
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const ok = (label, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`);

// Real questions + answers from the banks
const mq = fs.readFileSync(`${ROOT}/src/data/moduleQuizData.ts`, "utf8");
const start = mq.indexOf("QA-0: Mathematical Foundation");
const modQs = [...mq.slice(start).matchAll(/id:\s*"(qa0-s1-\d+)",[\s\S]*?answer:\s*(-?\d+)/g)]
  .slice(0, 10)
  .map((m) => ({ id: m[1], answer: Number(m[2]) }));
const pyq = JSON.parse(fs.readFileSync(`${ROOT}/src/data/cat_2024_questions.json`, "utf8"))
  .filter((q) => q.slot === "Slot 1" && q.section === "VARC");

const email = `qa-p1-${Date.now()}@example.com`;
let r = await call("POST", "/api/auth/signup", { fullName: "Phase One", email, password: "Phase1-Test-Pass" });
ok("signup", r.status === 200);

// 1. Enrollment schedules a plan starting today
r = await call("POST", "/api/topics/enroll", { topicId: "qa-quantitative-ability" });
ok("enroll QA", r.status === 200, `status ${r.status}`);
r = await call("GET", "/api/dashboard");
const tasks = r.json?.tasks || [];
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dates = tasks.map((t) => t.task_date).sort();
ok("tasks scheduled from today (no fake backlog)", tasks.length > 0 && dates[0] === today,
  `${tasks.length} tasks, first ${dates[0]}, last ${dates.at(-1)}, today ${today}, completed ${tasks.filter((t) => t.is_completed).length}`);
await call("POST", "/api/topics/enroll", { topicId: "qa-quantitative-ability" });
r = await call("GET", "/api/dashboard");
ok("re-enroll does not duplicate tasks", (r.json?.tasks || []).length === tasks.length, `${(r.json?.tasks || []).length}`);
await call("POST", "/api/topics/enroll", { topicId: "dilr-data-interpretation" });
r = await call("GET", "/api/dashboard");
const dilr = (r.json?.tasks || []).filter((t) => t.category === "DILR");
ok("second section adds its own tasks from today", dilr.length > 0 && dilr.map((t) => t.task_date).sort()[0] === today, `${dilr.length} DILR tasks`);

// 2. Lesson completion is idempotent; points via ledger
r = await call("POST", "/api/topics/progress", { topicId: "qa-quantitative-ability", lessonId: "qa-0-1" });
ok("complete lesson qa-0-1 → +10", r.status === 200 && r.json?.pointsAwarded === 10, `points ${r.json?.pointsAwarded}, progress ${r.json?.progress?.progress_percent}%`);
r = await call("POST", "/api/topics/progress", { topicId: "qa-quantitative-ability", lessonId: "qa-0-1" });
ok("complete same lesson again → 0 points", r.json?.pointsAwarded === 0, `points ${r.json?.pointsAwarded}`);
r = await call("POST", "/api/topics/progress", { topicId: "qa-quantitative-ability", lessonId: "not-a-lesson" });
ok("unknown lesson rejected", r.status === 404, `status ${r.status}`);

// 3. Heartbeat
const hb = [];
for (let i = 0; i < 4; i++) {
  hb.push((await call("POST", "/api/activity", { topicId: "qa-quantitative-ability", lessonId: "qa-0-1", seconds: 500 })).json);
}
ok("heartbeat capped at 35 s each", hb[0]?.recordedSeconds === 35, JSON.stringify(hb.map((h) => h?.throttled ? "throttled" : h?.recordedSeconds)));
ok("4th heartbeat within 90 s throttled", hb[3]?.throttled === true);

// 4. Module quiz graded on the server
const modBody = (responses, extra = {}) => ({ kind: "module_quiz", topicId: "qa-quantitative-ability", moduleKey: "QA-0: Mathematical Foundation", durationSeconds: 300, strikes: 0, responses, ...extra });
const allRight = modQs.map((q) => ({ questionId: q.id, selectedOption: q.answer }));
r = await call("POST", "/api/quiz/attempts", modBody(allRight));
let a = r.json?.attempt;
ok("module quiz all correct → passed, +50", a?.passed === true && a?.pointsAwarded === 50, `${a?.correctCount}/${a?.questionCount}, ${a?.percentage}%, pts ${a?.pointsAwarded} ${r.json?.error || ""}`);
r = await call("POST", "/api/quiz/attempts", modBody(allRight, { durationSeconds: 200 }));
ok("passing the same module again → 0 pts", r.json?.attempt?.pointsAwarded === 0);
const allWrong = modQs.map((q) => ({ questionId: q.id, selectedOption: (q.answer + 1) % 4 }));
r = await call("POST", "/api/quiz/attempts", modBody(allWrong, { durationSeconds: 100, strikes: 2 }));
ok("all wrong → failed, score 0", r.json?.attempt?.passed === false && Number(r.json?.attempt?.finalScore) === 0, `${r.json?.attempt?.percentage}%`);
r = await call("POST", "/api/quiz/attempts", modBody([{ questionId: "made-up-q", selectedOption: 0 }]));
ok("unknown question rejected", r.status === 400, r.json?.error);
r = await call("POST", "/api/quiz/attempts", { ...modBody(allRight), moduleKey: "Fake Module" });
ok("unknown module rejected", r.status === 400, r.json?.error);

// 5. PYQ with CAT marking (+3 / -1 MCQ, TITA no negative), strike penalty
const pyqResp = pyq.map((q, i) => (q.type === "TITA" ? { questionId: q.id, titaAnswer: i % 2 ? "999999" : null } : { questionId: q.id, selectedOption: 0 }));
r = await call("POST", "/api/quiz/attempts", { kind: "pyq", topicId: "varc-verbal-ability", section: "VARC", sourceRef: "CAT-2024-Slot 1-VARC", durationSeconds: 1800, strikes: 1, responses: pyqResp });
a = r.json?.attempt;
const expectedRaw = a ? a.correctCount * 3 - pyq.filter((q, i) => q.type === "MCQ").length + a.correctCount * 0 : null;
ok("PYQ graded with CAT scheme", r.status === 200 && a?.scoringScheme === "cat" && Number(a?.maxScore) === pyq.length * 3 && Number(a?.penalty) === 1,
  `${a?.correctCount} right / ${a?.wrongCount} wrong of ${a?.questionCount}; raw ${a?.rawScore}, penalty ${a?.penalty}, final ${a?.finalScore}/${a?.maxScore}; +${a?.pointsAwarded} pts ${r.json?.error || ""}`);

// 6. Lesson practice
r = await call("POST", "/api/quiz/attempts", { kind: "lesson_practice", topicId: "qa-quantitative-ability", lessonId: "qa-0-1", durationSeconds: 90, responses: [0, 1, 2].map((i) => ({ questionId: `lesson:qa-0-1:${i}`, selectedOption: 0 })) });
ok("lesson practice graded (no pass/fail)", r.status === 200 && r.json?.attempt?.passed === null, `status ${r.status} ${r.json?.error || ""} ${r.json?.attempt?.correctCount}/${r.json?.attempt?.questionCount}`);

// 7. Summary + dashboard reflect it
r = await call("GET", "/api/quiz/attempts?topicId=qa-quantitative-ability");
const mod = r.json?.modules?.["QA-0: Mathematical Foundation"];
ok("module summary", mod?.attempts === 3 && mod?.passed === true && mod?.consecutiveFails === 1, JSON.stringify(mod));
r = await call("GET", "/api/dashboard");
const d = r.json;
const todayStat = d?.weeklyStats?.at(-1);
ok("dashboard points from ledger (10 + 50 + 20 = 80)", d?.metrics?.pointsEarned === 80, `${d?.metrics?.pointsEarned}`);
ok("dashboard today shows learning + challenge time", todayStat?.date === today && todayStat.rawLearning > 0 && todayStat.rawChallenge > 0, JSON.stringify(todayStat));

// 8. Demo account: graded but not stored
r = await call("POST", "/api/quiz/attempts", modBody(allRight), `technocat_session=${process.argv[3]}`);
ok("demo attempt graded, not recorded", r.json?.recorded === false && r.json?.attempt?.attemptId === null && r.json?.attempt?.passed === true);

// 9. Cleanup
r = await call("POST", "/api/auth/delete-account");
ok("delete account (cascades to new tables)", r.status === 200);
console.log("TEST_EMAIL", email);
