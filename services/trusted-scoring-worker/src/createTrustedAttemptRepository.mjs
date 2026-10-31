import { createFirestoreRestClient } from "./firestoreRestClient.mjs";
import { createServiceAccountTokenProvider } from "./googleServiceAccountToken.mjs";
import { createFirestoreAttemptRepository } from "./firestoreAttemptRepository.mjs";

/**
 * Build the trusted repository from Cloudflare Worker environment bindings.
 * Expected secrets: GOOGLE_SERVICE_ACCOUNT_EMAIL and
 * GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY. Expected vars: FIREBASE_PROJECT_ID and
 * FIRESTORE_DATABASE_ID. Do not provide browser Firebase credentials here.
 */
export function createTrustedAttemptRepository(env, { fetchImpl = fetch, now = () => Date.now() } = {}) {
  const projectId = env?.FIREBASE_PROJECT_ID;
  const databaseId = env?.FIRESTORE_DATABASE_ID;
  const clientEmail = env?.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env?.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (typeof projectId !== "string" || !projectId ||
      projectId.startsWith("REPLACE_WITH_") ||
      typeof databaseId !== "string" || !databaseId ||
      databaseId.startsWith("REPLACE_WITH_") ||
      typeof clientEmail !== "string" || !clientEmail ||
      typeof privateKey !== "string" || !privateKey) {
    throw new Error("TRUSTED_FIRESTORE_CONFIGURATION_INCOMPLETE");
  }

  const tokenProvider = createServiceAccountTokenProvider({
    clientEmail,
    privateKey,
    fetchImpl,
    now,
  });
  const firestore = createFirestoreRestClient({
    projectId,
    databaseId,
    getAccessToken: tokenProvider.getAccessToken,
    fetchImpl,
  });
  return createFirestoreAttemptRepository({ firestore, now });
}
