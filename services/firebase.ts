import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ProjectState, ProjectMetadata } from '../types';

const firebaseConfig = {
    apiKey: "AIzaSyBt9nKxgvIhMB0KRrWsV9KOOH2fwKO-sgbE",
    authDomain: "forge-ai-designer.firebaseapp.com",
    projectId: "forge-ai-designer",
    storageBucket: "forge-ai-designer.firebasestorage.app",
    messagingSenderId: "793124605906",
    appId: "1:793124605906:web:735da1c532767e9182020b",
    measurementId: "G-MF6NPQQ0B8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const saveProject = async (userId: string, projectId: string, data: ProjectState) => {
    try {
        const payload = {
            ...data,
            id: projectId,
            updatedAt: Date.now()
        };
        await setDoc(doc(db, 'users', userId, 'projects', projectId), payload);
    } catch (error) {
        console.error("Error saving project:", error);
        throw error;
    }
};

export const createProject = async (userId: string, data: ProjectState): Promise<string> => {
    try {
        // Check limit
        const projectsRef = collection(db, 'users', userId, 'projects');
        const snapshot = await getDocs(projectsRef);
        if (snapshot.size >= 5) {
            throw new Error("Project limit reached (Max 5). Delete a project to create a new one.");
        }

        const newDocRef = doc(projectsRef); // Auto-ID
        await saveProject(userId, newDocRef.id, data);
        return newDocRef.id;
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
}

export const loadProject = async (userId: string, projectId: string): Promise<ProjectState | null> => {
    try {
        const docRef = doc(db, 'users', userId, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as ProjectState;
        }
        return null;
    } catch (error) {
        console.error("Error loading project:", error);
        return null;
    }
};

export const getUserProjects = async (userId: string): Promise<ProjectMetadata[]> => {
    try {
        const projectsRef = collection(db, 'users', userId, 'projects');
        const q = query(projectsRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || "Untitled Project",
            updatedAt: doc.data().updatedAt || Date.now()
        }));
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}

export const deleteProject = async (userId: string, projectId: string) => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
}
