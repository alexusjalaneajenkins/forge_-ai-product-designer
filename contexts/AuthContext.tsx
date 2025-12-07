import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: () => Promise<void>;
    logOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Error signing in", error);
            let msg = "Failed to sign in.";
            if (error.code === 'auth/unauthorized-domain') {
                msg = "Domain not authorized. Please add this domain in Firebase Console > Authentication > Settings.";
            } else if (error.code === 'auth/popup-closed-by-user') {
                msg = "Sign in cancelled.";
            } else {
                msg = error.message || msg;
            }
            setError(msg);
        }
    };

    const logOut = async () => {
        try {
            await signOut(auth);
            setError(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, loading, error, signIn, logOut, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
