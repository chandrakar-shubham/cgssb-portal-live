import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

const projectId = "cgssb-rules-test";
const rules = readFileSync("firestore.rules", "utf8");
const collections = ["trustedAttempts", "trustedAttemptIdempotency"];
const contexts = [
  { label: "unauthenticated client", create: env => env.unauthenticatedContext() },
  { label: "authenticated student", create: env => env.authenticatedContext("synthetic-student-1") },
  // The bootstrap admin must still be denied: client rules never grant access
  // to trusted scoring records, even to an application administrator.
  { label: "bootstrap administrator", create: env => env.authenticatedContext("VOynxZyDOJR4lg2x4va2U3qF5m72") },
];

const env = await initializeTestEnvironment({
  projectId,
  firestore: { rules },
});

try {
  // Seed existing records through the emulator-only rules bypass so read,
  // update, and delete checks exercise existing documents as well as creates.
  await env.withSecurityRulesDisabled(async adminContext => {
    const db = adminContext.firestore();
    for (const collectionName of collections) {
      await setDoc(doc(db, collectionName, "synthetic-attempt-1"), { synthetic: true });
    }
  });

  for (const contextSpec of contexts) {
    const context = contextSpec.create(env);
    const db = context.firestore();
    for (const collection of collections) {
      const ref = doc(db, collection, "synthetic-attempt-1");
      await assertFails(getDoc(ref));
      await assertFails(getDocs(collection(db, collection)));
      await assertFails(setDoc(doc(db, collection, "synthetic-create-1"), {
        userId: "synthetic-student-1",
        testId: "synthetic-test-1",
        score: 100,
        fingerprint: "synthetic-only",
      }));
      await assertFails(updateDoc(ref, { score: 0 }));
      await assertFails(deleteDoc(ref));
    }
    console.log(`PASS: ${contextSpec.label} denied read/write access to both trusted collections`);
  }
  console.log("Firestore trusted-collection emulator authorization tests passed.");
} finally {
  await env.cleanup();
}
