const rawUrl = process.env.URL?.trim();
const token = process.env.TOKEN?.trim();

if (!rawUrl || !token) {
  console.error("Missing URL or TOKEN in .env");
  process.exit(1);
}

const baseUrl = (/^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`).replace(
  /\/$/,
  ""
);

async function call(name, path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {})
    },
    signal: AbortSignal.timeout(120_000)
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  console.log(`${name}: HTTP ${response.status}`);
  return { response, payload };
}

const verification = await call("token", "/api/verify-token");
if (!verification.response.ok || !verification.payload?.user?.id) {
  console.error("Token verification failed");
  process.exit(1);
}

const history = await call(
  "history",
  "/api/monitoring/history?period=session&page=1&page_size=2"
);
if (!history.response.ok || !Array.isArray(history.payload?.items)) {
  console.error("Monitoring history endpoint is not available on this backend");
  process.exitCode = 1;
}

const openapi = await call("openapi", "/openapi.json");
const monitoringSchema =
  openapi.payload?.components?.schemas?.MonitoringRecordResponse;
const requiredMonitoringFields = new Set(monitoringSchema?.required ?? []);
const heartbeatFields = [
  "event",
  "baby_center_x",
  "baby_center_y",
  "baby_ratio",
  "activity_level",
  "session_id"
];
const missingHeartbeatFields = heartbeatFields.filter(
  (field) => !requiredMonitoringFields.has(field)
);

if (!openapi.response.ok || missingHeartbeatFields.length > 0) {
  console.error(
    `Monitoring contract is missing required fields: ${missingHeartbeatFields.join(", ")}`
  );
  process.exitCode = 1;
}

const invalidHistoryItem = history.payload?.items?.find((item) =>
  ["session_count", "sample_count", "duration_seconds"].some(
    (field) => typeof item?.[field] !== "number"
  )
);
if (invalidHistoryItem) {
  console.error("Monitoring history returned an invalid session aggregate");
  process.exitCode = 1;
}

const alarms = await call("alarm state", "/api/alarms/active");
if (!alarms.response.ok || typeof alarms.payload?.active !== "boolean") {
  console.error("Alarm state endpoint is not available on this backend");
  process.exitCode = 1;
}

if (process.env.VERIFY_REPORT === "1") {
  const report = await call("weekly report", "/api/reports", {
    method: "POST",
    body: JSON.stringify({ period: "weekly" })
  });
  if (!report.response.ok && report.response.status !== 404) {
    console.error("Report endpoint failed unexpectedly");
    process.exitCode = 1;
  }
}
