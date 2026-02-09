
import { ChatSession, Project } from '../types';

const DB_NAME = 'CereonAI_DB_V2';
const DB_VERSION = 3;
const STORE_SESSIONS = 'sessions';
const STORE_USERS = 'users';
const STORE_PROJECTS = 'projects';
const STORE_ACTIVE = 'active_session'; // Stores the name of the currently logged-in user

export interface UserProfile {
  fullName: string;
  password?: string; // New password field
  role?: string;
  goal?: string;
  personalization?: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        sStore.createIndex('userName', 'userName', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: 'fullName' });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const pStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        pStore.createIndex('userName', 'userName', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
        db.createObjectStore(STORE_ACTIVE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};

// User Management
export const saveUserProfile = async (profile: UserProfile) => {
  const db = await openDB();
  const tx = db.transaction(STORE_USERS, 'readwrite');
  tx.objectStore(STORE_USERS).put(profile);
  return new Promise((resolve) => tx.oncomplete = () => resolve(true));
};

export const checkUserExists = async (name: string): Promise<boolean> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_USERS, 'readonly');
    const request = tx.objectStore(STORE_USERS).get(name);
    request.onsuccess = () => resolve(!!request.result);
  });
};

export const getUserByName = async (name: string): Promise<UserProfile | null> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_USERS, 'readonly');
    const request = tx.objectStore(STORE_USERS).get(name);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const setActiveUser = async (name: string | null) => {
  const db = await openDB();
  const tx = db.transaction(STORE_ACTIVE, 'readwrite');
  if (name) {
    tx.objectStore(STORE_ACTIVE).put({ id: 'current', name });
  } else {
    tx.objectStore(STORE_ACTIVE).delete('current');
  }
};

export const getActiveUserName = async (): Promise<string | null> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_ACTIVE, 'readonly');
    const request = tx.objectStore(STORE_ACTIVE).get('current');
    request.onsuccess = () => resolve(request.result?.name || null);
  });
};

// Sessions & Projects (Filtered by User)
export const saveSession = async (session: ChatSession & { userName: string }) => {
  const db = await openDB();
  const tx = db.transaction(STORE_SESSIONS, 'readwrite');
  tx.objectStore(STORE_SESSIONS).put(session);
};

export const getSessions = async (userName: string): Promise<ChatSession[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_SESSIONS, 'readonly');
    const index = tx.objectStore(STORE_SESSIONS).index('userName');
    const request = index.getAll(userName);
    request.onsuccess = () => {
      const results = request.result as ChatSession[];
      resolve(results.sort((a, b) => b.lastModified - a.lastModified));
    };
  });
};

export const deleteSession = async (id: string) => {
  const db = await openDB();
  const tx = db.transaction(STORE_SESSIONS, 'readwrite');
  tx.objectStore(STORE_SESSIONS).delete(id);
};

export const saveProject = async (project: Project & { userName: string }) => {
  const db = await openDB();
  const tx = db.transaction(STORE_PROJECTS, 'readwrite');
  tx.objectStore(STORE_PROJECTS).put(project);
};

export const getProjects = async (userName: string): Promise<Project[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const index = tx.objectStore(STORE_PROJECTS).index('userName');
    const request = index.getAll(userName);
    request.onsuccess = () => {
      const results = request.result as Project[];
      resolve(results.sort((a, b) => b.createdAt - a.createdAt));
    };
  });
};

export const deleteProject = async (id: string) => {
  const db = await openDB();
  const tx = db.transaction([STORE_PROJECTS, STORE_SESSIONS], 'readwrite');
  tx.objectStore(STORE_PROJECTS).delete(id);
  const sessionStore = tx.objectStore(STORE_SESSIONS);
  const request = sessionStore.getAll();
  request.onsuccess = () => {
    const sessions = request.result as ChatSession[];
    sessions.forEach(s => {
      if (s.projectId === id) {
        delete s.projectId;
        sessionStore.put(s);
      }
    });
  };
};
