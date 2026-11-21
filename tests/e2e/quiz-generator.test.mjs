// Quiz generator end-to-end test. Usage: node gentest.mjs <demoToken>
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

await call("POST", "/api/auth/signup", { fullName: "Gen Test", email: `qa-gen-${Date.now()}@example.com`, password: "Gen-Test-Pass-1" });
const t0 = Date.now();
let r = await call("POST", "/api/quiz/generate", { topicId: "qa-quantitative-ability", count: 5 });
const quiz = r.json;
ok("generate returns 5 questions", r.status === 200 && quiz?.questions?.length === 5, `source=${quiz?.source}, ${((Date.now() - t0) / 1000).toFixed(1)}s ${r.json?.error || ""}`);
ok("no answers leaked to the client", quiz?.questions?.every((q) => !("correct_option" in q) && !("answer" in q) && !("explanation" in q)));
if (quiz?.questions?.[0]) console.log("   sample:", quiz.questions[0].question.slice(0, 140), "|", quiz.questions[0].options.join(" / "));

r = await call("POST", "/api/quiz/attempts", { kind: "topic_drill", topicId: "qa-quantitative-ability", durationSeconds: 240, responses: quiz.questions.map((q) => ({ questionId: q.id, selectedOption: 1 })) });
const a = r.json?.attempt;
ok("drill graded on server", r.status === 200 && a?.questionCount === 5 && a?.passed === null, `${a?.correctCount}/5 ${r.json?.error || ""}`);
ok("results include correct answer + explanation", a?.responses?.every((x) => x.correctOption !== null && typeof x.explanation === "string" && x.explanation.length > 10));

r = await call("GET", "/api/me/metrics");
ok("drill appears in test history", r.json?.tests?.recent?.some((t) => t.kind === "topic_drill"), r.json?.tests?.recent?.[0]?.title);
const wrongIds = (a?.responses || []).filter((x) => !x.isCorrect).map((x) => x.questionId);
if (wrongIds.length) {
  r = await call("GET", `/api/quiz/questions?ids=${encodeURIComponent(wrongIds.join(","))}`);
  ok("review details available for generated questions", Object.values(r.json?.questions || {}).every((d) => d && d.text), `${Object.keys(r.json?.questions || {}).length} returned`);
}
r = await call("GET", `/api/quiz/questions?ids=gen:00000000-0000-4000-8000-000000000000`);
ok("unanswered question ids are not revealed", Object.keys(r.json?.questions || {}).length === 0);

// Demo: bank only, nothing stored
r = await call("POST", "/api/quiz/generate", { topicId: "dilr-data-interpretation", count: 5 }, `technocat_session=${process.argv[2]}`);
ok("demo gets bank questions (no AI cost)", r.status === 200 && r.json?.source === "bank" && r.json.questions.length === 5, `${r.json?.questions?.length}`);

await call("POST", "/api/auth/delete-account");
