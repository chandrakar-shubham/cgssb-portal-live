import type { Firestore, CollectionReference, DocumentReference } from 'firebase-admin/firestore';

export function collection(db: Firestore, name: string): CollectionReference {
  return db.collection(name);
}

export function doc(db: Firestore, collectionName: string, id: string): DocumentReference {
  return db.collection(collectionName).doc(id);
}

export async function getDocs(ref: CollectionReference) {
  return ref.get();
}

export async function getDoc(ref: DocumentReference) {
  return ref.get();
}

export async function setDoc(ref: DocumentReference, data: Record<string, any>, options?: { merge?: boolean }) {
  return ref.set(data, options);
}

export async function deleteDoc(ref: DocumentReference) {
  return ref.delete();
}
