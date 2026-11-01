const NON_PRODUCTION_SUFFIX = /-(?:dev|test|qa|staging|sandbox)$/;
const PRODUCTION_PROJECT_ID = "gen-lang-client-0783153446";

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
  if (typeof exportedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(exportedAt)
      || !Number.isFinite(Date.parse(exportedAt))) {
    throw snapshotError("INVALID_EXPORT_TIMESTAMP", "snapshot exportedAt must be a valid UTC ISO timestamp");
  }
  if (!Array.isArray(snapshot.tests) || !Array.isArray(snapshot.questions)) {
    throw snapshotError("INVALID_SNAPSHOT_RECORDS", "snapshot tests and questions must be arrays");
  }
  if (snapshot.tests.some(record => !record || typeof record !== "object" || Array.isArray(record))
      || snapshot.questions.some(record => !record || typeof record !== "object" || Array.isArray(record))) {
    throw snapshotError("INVALID_SNAPSHOT_RECORD", "snapshot records must be objects");
  }

  return Object.freeze({
    projectId,
    databaseId,
    exportedAt,
    tests: snapshot.tests,
    questions: snapshot.questions,
  });
}
