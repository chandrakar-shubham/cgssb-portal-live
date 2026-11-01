const NON_PRODUCTION_SUFFIX = /-(?:dev|test|qa|staging|sandbox)$/;
const PRODUCTION_PROJECT_ID = "gen-lang-client-0783153446";
const MAX_SNAPSHOT_TESTS = 5_000;
const MAX_SNAPSHOT_QUESTIONS = 25_000;
const SYNTHETIC_ID_PATTERN = /^synthetic-[A-Za-z0-9_-]{1,119}$/;

function snapshotError(code, message) {
  const error = new TypeError(message);
  error.code = code;
  return error;
}

/**
 * Validate an operator-supplied catalog export before passing it to the
 * read-only trusted catalog audit. This function performs no I/O and never
 * emits question content, answer keys, or explanations.
 *
 * Both the export metadata and the operator's expected target must identify
 * the same isolated non-production project and named database.
 */
export function validateTrustedCatalogSnapshot({
  snapshot,
  expectedProjectId,
  expectedDatabaseId,
}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw snapshotError("INVALID_SNAPSHOT", "catalog snapshot must be an object");
  }
  if (snapshot.schemaVersion !== 1) {
    throw snapshotError("UNSUPPORTED_SNAPSHOT_VERSION", "unsupported catalog snapshot schema version");
  }

  const metadata = snapshot.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw snapshotError("INVALID_SNAPSHOT_METADATA", "catalog snapshot metadata is required");
  }

  const { projectId, databaseId, exportedAt } = metadata;
  if (typeof expectedProjectId !== "string" || !expectedProjectId
      || typeof expectedDatabaseId !== "string" || !expectedDatabaseId) {
    throw snapshotError("MISSING_TARGET_CONFIRMATION", "expected non-production project and database IDs are required");
  }
  if (projectId !== expectedProjectId || databaseId !== expectedDatabaseId) {
    throw snapshotError("SNAPSHOT_TARGET_MISMATCH", "snapshot target does not match operator-confirmed target");
  }
  if (projectId === PRODUCTION_PROJECT_ID || !NON_PRODUCTION_SUFFIX.test(projectId)) {
    throw snapshotError("PRODUCTION_OR_UNISOLATED_PROJECT", "catalog snapshots are accepted only from isolated non-production projects");
  }
  if (databaseId === "(default)" || !NON_PRODUCTION_SUFFIX.test(databaseId)) {
    throw snapshotError("PRODUCTION_OR_UNISOLATED_DATABASE", "catalog snapshots require an isolated named non-production database");
  }
  const timestampMatch = typeof exportedAt === "string"
    ? /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(?:\\.(\\d{1,3}))?Z$/.exec(exportedAt)
    : null;
  const parsedTimestamp = timestampMatch ? Date.parse(exportedAt) : NaN;
  const parsedDate = Number.isFinite(parsedTimestamp) ? new Date(parsedTimestamp) : null;
  const timestampIsCalendarValid = Boolean(parsedDate && timestampMatch
    && parsedDate.getUTCFullYear() === Number(timestampMatch[1])
    && parsedDate.getUTCMonth() + 1 === Number(timestampMatch[2])
    && parsedDate.getUTCDate() === Number(timestampMatch[3])
    && parsedDate.getUTCHours() === Number(timestampMatch[4])
    && parsedDate.getUTCMinutes() === Number(timestampMatch[5])
    && parsedDate.getUTCSeconds() === Number(timestampMatch[6])
    && parsedDate.getUTCMilliseconds() === Number((timestampMatch[7] || "").padEnd(3, "0") || 0));
  if (!timestampIsCalendarValid) {
    throw snapshotError("INVALID_EXPORT_TIMESTAMP", "snapshot exportedAt must be a valid UTC ISO timestamp");
  }
  if (!Array.isArray(snapshot.tests) || !Array.isArray(snapshot.questions)) {
    throw snapshotError("INVALID_SNAPSHOT_RECORDS", "snapshot tests and questions must be arrays");
  }
  if (snapshot.tests.length > MAX_SNAPSHOT_TESTS || snapshot.questions.length > MAX_SNAPSHOT_QUESTIONS) {
    throw snapshotError("SNAPSHOT_RECORD_LIMIT_EXCEEDED", "snapshot exceeds the offline audit record limits");
  }
  if (snapshot.tests.some(record => !record || typeof record !== "object" || Array.isArray(record))
      || snapshot.questions.some(record => !record || typeof record !== "object" || Array.isArray(record))) {
    throw snapshotError("INVALID_SNAPSHOT_RECORD", "snapshot records must be objects");
  }
  if (snapshot.tests.some(record => typeof record.id !== "string" || !SYNTHETIC_ID_PATTERN.test(record.id))
      || snapshot.questions.some(record => typeof record.id !== "string" || !SYNTHETIC_ID_PATTERN.test(record.id))) {
    throw snapshotError("NON_SYNTHETIC_RECORD_ID", "offline audit snapshots require bounded synthetic record IDs");
  }

  return Object.freeze({
    projectId,
    databaseId,
    exportedAt,
    tests: snapshot.tests,
    questions: snapshot.questions,
  });
}
