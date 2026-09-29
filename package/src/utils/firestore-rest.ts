/**
 * Firestore REST API helper for server-side authenticated writes.
 * 
 * Firebase Admin SDK's getFirestore() requires Application Default Credentials
 * (service account JSON / gcloud ADC) which are not available in local dev
 * without explicit setup.
 * 
 * This helper uses the Firestore REST API directly with the user's ID token
 * as the Bearer token. This means writes are:
 * - Properly authenticated (request.auth is set in Firestore rules)
 * - Respect security rules (unlike Admin SDK which bypasses them)
 * - Work without any service account setup
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FieldValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { timestampValue: string }
  | { arrayValue: { values: FieldValue[] } }
  | { mapValue: { fields: Record<string, FieldValue> } };

function toFirestoreValue(value: any): FieldValue {
  if (value === null || value === undefined) return { stringValue: '' };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(Math.floor(value)) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    const fields: Record<string, FieldValue> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(data: Record<string, any>): Record<string, FieldValue> {
  const fields: Record<string, FieldValue> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

/**
 * Add a document to a Firestore collection, authenticated as the user.
 * @param idToken - The user's Firebase ID token (from session cookie)
 * @param collection - Collection name (e.g. 'Drafts')
 * @param data - Document data
 * @returns The created document ID
 */
export async function addDocAsUser(
  idToken: string,
  collection: string,
  data: Record<string, any>
): Promise<string> {
  const url = `${FIRESTORE_BASE}/${collection}`;
  const body = { fields: toFirestoreFields(data) };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Firestore REST write failed: ${JSON.stringify(err)}`);
  }

  const result = await res.json();
  // Extract doc ID from the name field: "projects/.../documents/Drafts/DOCID"
  const docId = result.name.split('/').pop();
  return docId;
}

/**
 * Read a document from Firestore, authenticated as the user.
 */
export async function getDocAsUser(
  idToken: string,
  collection: string,
  docId: string
): Promise<Record<string, any> | null> {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const result = await res.json();
  if (!result.fields) return null;

  // Convert Firestore fields back to plain JS object
  const data: Record<string, any> = {};
  for (const [key, val] of Object.entries(result.fields as Record<string, FieldValue>)) {
    data[key] = fromFirestoreValue(val);
  }
  return data;
}

function fromFirestoreValue(val: FieldValue): any {
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

/**
 * List documents from a Firestore collection, authenticated as the user.
 */
export async function listDocsAsUser(
  idToken: string,
  collection: string
): Promise<Array<Record<string, any>>> {
  const url = `${FIRESTORE_BASE}/${collection}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!res.ok) return [];
  const result = await res.json().catch(() => ({}));
  if (!result.documents || !Array.isArray(result.documents)) return [];

  return result.documents.map((doc: any) => {
    const docId = doc.name.split('/').pop();
    const data: Record<string, any> = { id: docId };
    if (doc.fields) {
      for (const [key, val] of Object.entries(doc.fields as Record<string, FieldValue>)) {
        data[key] = fromFirestoreValue(val);
      }
    }
    return data;
  });
}

/**
 * Update existing Firestore document fields via REST API using PATCH.
 */
export async function updateDocAsUser(
  idToken: string,
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}`;
  const body = { fields: toFirestoreFields(data) };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Firestore REST update failed: ${JSON.stringify(err)}`);
  }
}
