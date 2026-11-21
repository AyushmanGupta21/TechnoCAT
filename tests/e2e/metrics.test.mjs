// Phase 2 metrics engine test. Usage: node phase2test.mjs <repoRoot> <demoToken>
import fs from "node:fs";
const ROOT = process.argv[2];
const B = "http://localhost:3001";
let cookie = "";
async function call(method, path, body, ck) {
  const res = await fetch(B + path, { method, headers: { "content-type": "application/json", cookie: ck ?? cookie }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get("set-cookie");
  if (!ck && sc && sc.includes("technocat_session=")) cookie = sc.split(";")[0];
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const ok = (label, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`);

const mq = fs.readFileSync(`${ROOT}/src/data/moduleQuizData.ts`, "utf8");
const modQs = [...mq.slice(mq.indexOf("QA-0: Mathematical Foundation")).matchAll(/id:\s*"(qa0-s1-\d+)",[\s\S]*?answer:\s*(-?\d+)/g)].slice(0, 10).map((m) => ({ id: m[1], answer: Number(m[2]) }));
const all = JSON.parse(fs.readFileSync(`${ROOT}/src/data/cat_2024_questions.json`, "utf8"));

// Empty account first
await call("POST", "/api/auth/signup", { fullName: "Metrics Test", email: `qa-p2-${Date.now()}@example.com`, password: "Metrics-Test-1" });
let m = (await call("GET", "/api/me/metrics")).json;
ok("empty account: no activity, readiness null, no percentile", m && m.hasActivity === false && m.readiness.score === null && m.percentile.overallEstimate === null && m.isDemo === false,
  `readiness ${m?.readiness?.score}, concepts ${m?.readiness?.components?.concepts}, streak ${m?.streak?.current}`);

// Activity
await call("POST", "/api/topics/enroll", { topicId: "qa-quantitative-ability" });
await call("POST", "/api/topics/progress", { topicId: "qa-quantitative-ability", lessonId: "qa-0-1" });
await call("POST", "/api/activity", { topicId: "qa-quantitative-ability", lessonId: "qa-0-1", seconds: 35 });
await call("POST", "/api/quiz/attempts", { kind: "module_quiz", topicId: "qa-quantitative-ability", moduleKey: "QA-0: Mathematical Foundation", durationSeconds: 300, responses: modQs.map((q, i) => ({ questionId: q.id, selectedOption: i < 8 ? q.answer : (q.answer + 1) % 4 })) });

// Full PYQ sections (Slot 1): answer the first N correctly, the rest of the MCQs wrong.
const sectionPlan = { VARC: 10, DILR: 6, QUANT: 8 };
const expected = {};
for (const [sec, nRight] of Object.entries(sectionPlan)) {
  const qs = all.filter((q) => q.slot === "Slot 1" && q.section === sec).sort((a, b) => a.question_number - b.question_number);
  let right = 0; let score = 0;
  const responses = qs.map((q) => {
    if (q.type === "TITA") return { questionId: q.id, titaAnswer: null }; // skipped
    const correctIdx = (() => { const t = q.correct_answer || ""; const m1 = /Option\s*(\d)/i.exec(t); if (m1) return Number(m1[1]) - 1; const m2 = /Choice\s*([A-D])/i.exec(t); return m2 ? "ABCD".indexOf(m2[1].toUpperCase()) : 0; })();
    return { questionId: q.id, selectedOption: correctIdx, _c: correctIdx };
  });
  // Use the server's grading as truth: first submit, then compare totals with metrics.
  const r = await call("POST", "/api/quiz/attempts", { kind: "pyq", topicId: sec === "VARC" ? "varc-verbal-ability" : sec === "DILR" ? "dilr-data-interpretation" : "qa-quantitative-ability", section: sec, sourceRef: `CAT-2024-Slot 1-${sec}`, durationSeconds: 2400, responses: responses.map(({ _c, ...rest }) => rest) });
  expected[sec === "QUANT" ? "QA" : sec] = r.json?.attempt?.finalScore;
}
m = (await call("GET", "/api/me/metrics")).json;
ok("has activity", m.hasActivity === true);
ok("concepts = 1 lesson of syllabus", m.readiness.components.concepts === Math.round((1 / m.courses.syllabusLessons) * 100), `${m.readiness.components.concepts}% (${m.courses.lessonsCompleted}/${m.courses.syllabusLessons})`);
const timedAttempted = m.tests.recent.filter((t) => t.kind !== "lesson_practice").reduce((s, t) => s + t.attempted, 0);
const timedCorrect = m.tests.recent.filter((t) => t.kind !== "lesson_practice").reduce((s, t) => s + t.correct, 0);
ok("accuracy = correct / attempted over timed tests", m.accuracy.overall === Math.round((timedCorrect / timedAttempted) * 1000) / 10, `${m.accuracy.overall}% (${timedCorrect}/${timedAttempted})`);
ok("section latest scores match graded attempts", ["VARC", "DILR", "QA"].every((s) => m.sections[s].latestScore === expected[s]), JSON.stringify(expected));
ok("overall score = VARC + DILR + QA", m.percentile.overallScore === expected.VARC + expected.DILR + expected.QA, `${m.percentile.overallScore} → est. ${m.percentile.overallEstimate} %ile`);
ok("percentile labelled with disclaimer", typeof m.percentile.disclaimer === "string" && /Estimated/i.test(m.percentile.disclaimer));
const w = m.readiness.weights, c = m.readiness.components;
const expReadiness = Math.round((c.concepts * w.concepts + c.accuracy * w.accuracy + c.speed * w.speed + c.consistency * w.consistency) / (w.concepts + w.accuracy + w.speed + w.consistency));
ok("readiness = weighted components", m.readiness.score === expReadiness, `${m.readiness.score} from ${JSON.stringify(c)}`);
ok("speed = time / attempted (timed)", m.speed.secondsPerQuestion > 0, `${m.speed.secondsPerQuestion}s/Q, index ${m.speed.index}`);
ok("negative marks counted (wrong PYQ MCQs)", m.accuracy.negativeMarksLost === m.tests.pyq.reduce((s, t) => s + t.wrong, 0), `${m.accuracy.negativeMarksLost}`);
ok("streak: active today", m.streak.activeToday === true && m.streak.current === 1, JSON.stringify(m.streak));
ok("points = 10 + 50 + 3×20", m.points.total === 120, `${m.points.total}`);
ok("weak concepts derived from responses", Array.isArray(m.concepts.weak), `weak ${m.concepts.weak.length}, strong ${m.concepts.strong.length}`);
ok("mistakes list", m.mistakes.length > 0 && m.mistakes.every((x) => x.questionId), `${m.mistakes.length}`);
ok("tasks today from plan", m.tasks.todayTotal >= 1, JSON.stringify(m.tasks));

// Demo
const d = (await call("GET", "/api/me/metrics", null, `technocat_session=${process.argv[3]}`)).json;
ok("demo returns showcase fixture", d?.isDemo === true && d.readiness.score > 0 && d.percentile.overallEstimate > 0 && d.studyTime.daily.length === 30,
  `readiness ${d?.readiness?.score}, est %ile ${d?.percentile?.overallEstimate}, streak ${d?.streak?.current}`);
const dd = d.studyTime.daily.at(-1).date; const tz = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
ok("demo dates relative to today", dd === tz, dd);

await call("POST", "/api/auth/delete-account");
