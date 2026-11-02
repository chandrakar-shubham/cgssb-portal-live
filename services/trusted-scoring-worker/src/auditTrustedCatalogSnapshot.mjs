import { auditTrustedTestCatalog } from "./trustedTestDefinition.mjs";
import { validateTrustedCatalogSnapshot } from "./trustedCatalogSnapshot.mjs";

/**
 * Run the trusted compatibility audit against a validated offline snapshot.
 * The returned value contains only target metadata and the aggregate audit
 * report; raw test/question records, answer keys, and explanations are never
 * copied into the result.
 */
export function auditTrustedCatalogSnapshot(options) {
  const validated = validateTrustedCatalogSnapshot(options);
  const audit = auditTrustedTestCatalog({
    tests: validated.tests,
    questions: validated.questions,
  });

  return Object.freeze({
    metadata: Object.freeze({
      projectId: validated.projectId,
      databaseId: validated.databaseId,
      exportedAt: validated.exportedAt,
    }),
    audit,
  });
}
