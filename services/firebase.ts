import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { ProjectState } from '../types';

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

export const saveProject = async (userId: string, data: ProjectState) => {
    try {
        await setDoc(doc(db, 'projects', userId), data);
    } catch (error) {
        console.error("Error saving project:", error);
        throw error;
    }
};

export const loadProject = async (userId: string): Promise<ProjectState | null> => {
    try {
        const docRef = doc(db, 'projects', userId);
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
