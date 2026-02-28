import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Query,
  DocumentData,
  QuerySnapshot,
  WriteBatch,
  writeBatch,
  increment,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./config";
import { User } from "@/types/user";
import {
  Issue,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueFilters,
} from "@/types/issue";

// ─── Collection References ───────────────────────────────────

export const COLLECTIONS = {
  USERS:  "users",
  ISSUES: "issues",
} as const;

// ─── Helpers ─────────────────────────────────────────────────

const docToIssue = (
  docSnap: DocumentSnapshot | QueryDocumentSnapshot
): Issue => {
  const data = docSnap.data() as DocumentData;
  return {
    ...data,
    id:        docSnap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
  } as Issue;
};

const docToUser = (
  docSnap: DocumentSnapshot | QueryDocumentSnapshot
): User => {
  const data = docSnap.data() as DocumentData;
  return {
    ...data,
    uid:       docSnap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
  } as User;
};

// ─── User Operations ─────────────────────────────────────────

export const createUserDocument = async (
  uid: string,
  userData: User
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
  });
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const userRef  = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return docToUser(userSnap);
};

export const updateUserDocument = async (
  uid: string,
  updates: Partial<User>
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// ─── Issue Operations ─────────────────────────────────────────

export const createIssue = async (
  payload: CreateIssuePayload & {
    citizenId: string;
    citizenName?: string;
    citizenEmail?: string;
  }
): Promise<Issue> => {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);

  const newIssue = {
    ...payload,
    status:             "reported",
    images:             payload.images ?? [],
    assignedDepartment: null,
    adminRemarks:       null,
    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  };

  const docRef = await addDoc(issuesRef, newIssue);

  // Return with resolved timestamps
  const createdSnap = await getDoc(docRef);
  return docToIssue(createdSnap);
};

export const getIssueById = async (id: string): Promise<Issue | null> => {
  const issueRef  = doc(db, COLLECTIONS.ISSUES, id);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) return null;
  return docToIssue(issueSnap);
};

export const updateIssue = async (
  id: string,
  updates: Partial<UpdateIssuePayload>
): Promise<void> => {
  const issueRef = doc(db, COLLECTIONS.ISSUES, id);
  await updateDoc(issueRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const getIssuesByUser = async (
  citizenId: string,
  pageLimit = 20
): Promise<Issue[]> => {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);
  const q = query(
    issuesRef,
    where("citizenId", "==", citizenId),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );

  const snap = await getDocs(q);
  return snap.docs.map(docToIssue);
};

export const getAllIssues = async (
  filters: IssueFilters = {},
  pageLimit = 50,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ issues: Issue[]; lastDoc: QueryDocumentSnapshot | null }> => {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);
  const constraints: QueryConstraint[] = [];

  if (filters.category && filters.category !== "all") {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.status && filters.status !== "all") {
    constraints.push(where("status", "==", filters.status));
  }
  if (filters.priority && filters.priority !== "all") {
    constraints.push(where("priority", "==", filters.priority));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageLimit));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q     = query(issuesRef, ...constraints);
  const snap  = await getDocs(q);
  const issues = snap.docs.map(docToIssue);
  const last   = snap.docs[snap.docs.length - 1] ?? null;

  return { issues, lastDoc: last };
};

// ─── Real-time Listener ──────────────────────────────────────

export const subscribeToUserIssues = (
  citizenId: string,
  callback: (issues: Issue[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.ISSUES),
    where("citizenId", "==", citizenId),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snap: QuerySnapshot) => {
    const issues = snap.docs.map(docToIssue);
    callback(issues);
  });
};

export const subscribeToIssue = (
  issueId: string,
  callback: (issue: Issue | null) => void
): (() => void) => {
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);
  return onSnapshot(issueRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback(docToIssue(snap));
  });
};

// ─── Analytics Queries ───────────────────────────────────────

export const getIssueCountByStatus = async (): Promise
  Record<string, number>
> => {
  const statuses = ["reported", "assigned", "in-progress", "resolved"];
  const counts: Record<string, number> = {};

  await Promise.all(
    statuses.map(async (status) => {
      const q    = query(
        collection(db, COLLECTIONS.ISSUES),
        where("status", "==", status)
      );
      const snap = await getCountFromServer(q);
      counts[status] = snap.data().count;
    })
  );

  return counts;
};

export const getIssueCountByCategory = async (): Promise
  Record<string, number>
> => {
  const categories = ["road", "garbage", "water", "streetlight", "sanitation"];
  const counts: Record<string, number> = {};

  await Promise.all(
    categories.map(async (category) => {
      const q    = query(
        collection(db, COLLECTIONS.ISSUES),
        where("category", "==", category)
      );
      const snap = await getCountFromServer(q);
      counts[category] = snap.data().count;
    })
  );

  return counts;
};

export const getRecentIssues = async (limitCount = 5): Promise<Issue[]> => {
  const q    = query(
    collection(db, COLLECTIONS.ISSUES),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToIssue);
};

export const getIssuesForAnalytics = async (): Promise<Issue[]> => {
  const q    = query(
    collection(db, COLLECTIONS.ISSUES),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToIssue);
};