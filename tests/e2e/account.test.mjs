// Session revocation on password change + notification state across devices.
// Usage: node account.test.mjs
const B = process.env.E2E_BASE_URL || "http://localhost:3001";
async function call(method, path, body, cookie) {
  const res = await fetch(B + path, { method, headers: { "content-type": "application/json", cookie: cookie || "" }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get("set-cookie");
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, cookie: sc && sc.includes("technocat_session=") ? sc.split(";")[0] : null };
}
const ok = (label, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`);

const email = `qa-acct-${Date.now()}@example.com`;
const deviceA = (await call("POST", "/api/auth/signup", { fullName: "Account Test", email, password: "First-Pass-123" })).cookie;
const deviceB = (await call("POST", "/api/auth/login", { email, password: "First-Pass-123" })).cookie;
ok("two devices signed in", Boolean(deviceA && deviceB));

const changed = await call("POST", "/api/auth/change-password", { currentPassword: "First-Pass-123", newPassword: "Second-Pass-456" }, deviceB);
const deviceBNew = changed.cookie;
ok("password changed on device B", changed.status === 200 && Boolean(deviceBNew));
let me = await call("GET", "/api/auth/me", null, deviceA);
ok("device A is signed out after the change", me.json?.user === null, `user=${JSON.stringify(me.json?.user)?.slice(0, 40)}`);
me = await call("GET", "/api/auth/me", null, deviceBNew);
ok("device B stays signed in", me.json?.user?.email === email);

// Notification state follows the account
await call("POST", "/api/topics/enroll", { topicId: "qa-quantitative-ability" }, deviceBNew);
const feed = await call("GET", "/api/notifications", null, deviceBNew);
const first = feed.json?.items?.[0]?.id;
ok("notification feed has real items", Boolean(first), `${feed.json?.items?.length} items`);
if (first) {
  const r = await call("POST", "/api/notifications", { action: "read", ids: [first] }, deviceBNew);
  const again = await call("GET", "/api/notifications", null, deviceBNew);
  ok("read state saved on the server", r.status === 200 && again.json?.state?.readIds?.includes(first));
}

await call("POST", "/api/auth/delete-account", null, deviceBNew);
