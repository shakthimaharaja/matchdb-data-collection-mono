/**
 * notify.service.ts
 *
 * Fire-and-forget HTTP calls to matchdb-jobs-services ingest endpoint.
 * Called after every successful save in jobs/candidates controllers.
 * Errors are silently swallowed — data-collection still succeeds even
 * if jobs-services is temporarily unreachable.
 */
import { env } from "../config/env.js";

type IngestType = "jobs" | "profiles";

async function postIngest(type: IngestType, records: unknown[]): Promise<void> {
  const url = `${env.JOBS_SERVICES_URL}/api/internal/ingest/${type}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": env.INTERNAL_API_KEY,
    },
    body: JSON.stringify({ records }),
    // Abort after 10 s so a slow jobs-services doesn't stall data-collection
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`[Notify] Ingest ${type} failed (${res.status}): ${text}`);
  }
}

/** Notify jobs-services of new job records. Fire-and-forget. */
export function notifyIngestJobs(records: unknown[]): void {
  if (!records.length) return;
  postIngest("jobs", records).catch((err) => {
    console.warn("[Notify] ingestJobs error:", err?.message ?? err);
  });
}

/** Notify jobs-services of new candidate profile records. Fire-and-forget. */
export function notifyIngestProfiles(records: unknown[]): void {
  if (!records.length) return;
  postIngest("profiles", records).catch((err) => {
    console.warn("[Notify] ingestProfiles error:", err?.message ?? err);
  });
}
